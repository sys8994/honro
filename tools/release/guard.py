#!/usr/bin/env python3
"""Offline, cooperative release ledger. It never performs or cancels remote writes."""
import argparse
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path
import time

ACTIVE = {'approval_pending', 'io_running', 'uncertain_write'}
KINDS = {'blob', 'tree', 'commit', 'ref'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':')).encode()).hexdigest()


@contextlib.contextmanager
def transaction(path):
    """Stable OS mutex + fsync/atomic replace; a crashed process releases flock."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(str(path) + '.lock', 'a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        state = json.loads(path.read_text()) if path.exists() else {
            'version': 1, 'owner': None, 'operations': {}, 'events': [], 'receipts': []}
        require(state['version'] == 1, 'Unsupported journal version')
        yield state
        temp = path.with_name(path.name + '.tmp')
        with open(temp, 'w') as output:
            json.dump(state, output, indent=2)
            output.flush()
            os.fsync(output.fileno())
        os.replace(temp, path)
        fd = os.open(path.parent, os.O_RDONLY)
        try:
            os.fsync(fd)
        finally:
            os.close(fd)


def transition(op, status, now):
    op['history'].append({'status': status, 'at': now})
    op['status'] = status
    op['updated_at'] = now


def validate_receipt(receipt, manifest):
    """Check normalized, externally collected evidence; never trust 'matches': true."""
    sha = manifest['master']
    require(len(sha) == 40 and all(c in '0123456789abcdef' for c in sha), 'Invalid master SHA')
    require(receipt['master'] == sha and receipt.get('master_verified') is True, 'Master not verified')
    require(receipt.get('pages_head_sha') == sha, 'Pages run is for a different/missing SHA')
    require(receipt.get('pages_status') == 'completed' and receipt.get('pages_conclusion') == 'success', 'Pages not successful')
    require(isinstance(receipt.get('pages_run'), int) and receipt['pages_run'] > 0, 'Missing Pages run')
    require(receipt.get('pages_url') == f"https://github.com/sys8994/honro/actions/runs/{receipt['pages_run']}", 'Wrong Pages run URL')
    expected = {}
    require(set(manifest['files']) == {'HONRO.html', 'HONRO_WORKSHOP.html'}, 'Need both HTML hashes')
    for name, sha256 in manifest['files'].items():
        require(len(sha256) == 64 and all(c in '0123456789abcdef' for c in sha256), 'Invalid SHA256')
        url = 'https://sys8994.github.io/honro/' + name
        expected[url] = sha256
        expected[url + '?release=' + sha] = sha256
    rows = receipt['public_bytes']
    require(len(rows) == 4 and {row['url'] for row in rows} == set(expected), 'Need exactly four distinct expected URLs')
    require(all(row['status'] == 200 and row['sha256'] == expected[row['url']] and row.get('checked_at') for row in rows), 'Public hash/status/time mismatch')
    return {'publication_verified': True, 'browser_qa': receipt.get('public_qa', 'not_recorded')}


def act(state, command, data, owner, now=None):
    now = time.time() if now is None else now
    require(isinstance(owner, str) and owner.strip(), 'Unique coordinator owner token required')
    if command == 'acquire':
        require(state['owner'] in (None, owner), 'Another writer owns this journal; do not use elapsed time to steal it')
        state['owner'] = owner
    elif command == 'recover':
        require(data.get('previous_owner') == state['owner'] and state['owner'] != owner, 'Recovery requires exact previous owner and a new token')
        require(data.get('coordinator_stopped') is True and data.get('evidence'), 'Manually verify old coordinator stopped; remote calls may still run')
        state['owner'] = owner
        for op in state['operations'].values():
            if op['status'] == 'io_running':
                transition(op, 'uncertain_write', now)
    else:
        require(state['owner'] == owner, 'Acquire the shared journal before changing it')
        if command == 'release':
            require(not any(op['status'] in ACTIVE for op in state['operations'].values()), 'Unresolved operation: preserve writer ownership')
            state['owner'] = None
        elif command == 'plan':
            require(data['kind'] in KINDS and data['lane'] in {'production', 'backfill'}, 'Invalid kind/lane')
            require(data['repository'] == 'sys8994/honro', 'Wrong repository')
            expected = data['expected']
            require(isinstance(expected, dict), 'Expected remote identity required')
            if data['kind'] == 'commit':
                require(set(expected) == {'tree', 'parents', 'message'} and expected['tree'] and isinstance(expected['parents'], list) and expected['message'], 'Commit needs exact tree, ordered parents and message')
            else:
                require(set(expected) == {'sha'} and len(expected['sha']) == 40 and all(c in '0123456789abcdef' for c in expected['sha']), 'Expected Git SHA required')
            require(all(dep in state['operations'] for dep in data.get('dependencies', [])), 'Unknown dependency')
            require(data.get('target'), 'Exact target required')
            # Object identity ignores source unit/branch/lane, so shared blobs/trees deduplicate.
            identity = {key: data[key] for key in ('repository', 'kind', 'target', 'expected')}
            if data['kind'] in {'blob', 'tree'}:
                identity.pop('target')
            key = digest(identity)
            if key not in state['operations']:
                state['operations'][key] = {**data, 'id': key, 'status': 'planned', 'created_at': now,
                    'updated_at': now, 'history': [{'status': 'planned', 'at': now}]}
            elif data['lane'] == 'production':
                state['operations'][key]['lane'] = 'production'
            return state['operations'][key]
        elif command == 'receipt':
            result = validate_receipt(data['receipt'], data['manifest'])
            state['receipts'].append({'at': now, **data, **result})
            return result
        elif command == 'tick':
            for op in state['operations'].values():
                if op['status'] in ACTIVE and now >= op['deadline_at'] and not op.get('escalated_at'):
                    op['escalated_at'] = now
                    if op['status'] == 'io_running':
                        transition(op, 'uncertain_write', now)
                    state['events'].append({'at': now, 'command': 'deadline', 'id': op['id'],
                        'action': 'report blocker; read-only reconcile; no retry or alternate write route'})
        else:
            op = state['operations'][data['id']]
            status = op['status']
            if command in {'pending', 'begin'}:
                require(status == 'planned' or (command == 'begin' and status == 'approval_pending'), 'Operation cannot be submitted again')
                others = [other for other in state['operations'].values() if other['id'] != op['id'] and other['status'] in ACTIVE]
                require(not any(other['kind'] == op['kind'] and other['target'] == op['target'] for other in others), 'Same target has an unresolved operation')
                require(all(state['operations'][dep]['status'] == 'succeeded' for dep in op.get('dependencies', [])), 'Dependencies are not verified')
                if command == 'begin':
                    if op['kind'] == 'blob':
                        require(sum(other['kind'] == 'blob' and other['status'] in {'io_running', 'uncertain_write'} for other in others) < 3, 'Three blob calls already running or uncertain')
                    else:
                        require(not any(other['kind'] != 'blob' and other['status'] == 'io_running' for other in others), 'One non-blob writer at a time')
                require(op['lane'] == 'production' or not any(other['lane'] == 'production' and other['status'] != 'succeeded' for other in state['operations'].values()), 'Production must finish before historical backfill')
                require(isinstance(data.get('timeout_seconds'), (int, float)) and 0 < data['timeout_seconds'] <= 1200, 'Deadline must be 1..1200 seconds')
                require(data.get('request_id'), 'Track the exact tool request/correlation ID')
                require(data['request_id'] not in op.get('previous_requests', []), 'A retry needs a new request ID')
                if command == 'begin':
                    require(data.get('authorization'), 'Record current authorization reference, not an inferred approval')
                    if status == 'approval_pending':
                        require(data['request_id'] == op['request_id'], 'Approval must belong to the same request')
                if status == 'planned':
                    op['request_started_at'] = now
                op['request_id'] = data['request_id']
                op['deadline_at'] = now + data['timeout_seconds']
                op.pop('escalated_at', None)
                op['authorization'] = data.get('authorization')
                transition(op, 'approval_pending' if command == 'pending' else 'io_running', now)
            elif command == 'end_no_effect':
                evidence = data['evidence']
                require(status in ACTIVE, 'Only unresolved operations can end without effect')
                require(evidence.get('request_id') == op['request_id'] and evidence.get('tool_ended') is True and evidence.get('tool_source'), 'Authoritative evidence the exact old tool call ended is required')
                require(evidence.get('outcome') in {'failed', 'cancelled', 'expired'} and evidence.get('approval_resolution') in {'not_required', 'approved', 'cancelled', 'expired'}, 'Unresolved approval or ambiguous tool outcome')
                remote = evidence.get('remote', {})
                require(remote.get('read_only') is True and remote.get('absent') is True and remote.get('source'), 'Fresh read-only proof of no remote effect required')
                require(remote.get('repository') == op['repository'] and remote.get('kind') == op['kind'] and remote.get('target') == op['target'] and remote.get('expected') == op['expected'], 'Wrong absence evidence target')
                require(isinstance(evidence.get('ended_at'), (int, float)) and isinstance(remote.get('checked_at'), (int, float)) and remote['checked_at'] >= evidence['ended_at'] >= op['request_started_at'], 'Absence must be checked after confirmed tool termination')
                op.setdefault('evidence', []).append(evidence)
                transition(op, 'no_effect', now)
            elif command == 'retry':
                require(status == 'no_effect' and data.get('authorization'), 'Retry needs confirmed no-effect termination and renewed explicit authorization')
                op.setdefault('previous_requests', []).append(op['request_id'])
                op['retry_authorization'] = data['authorization']
                transition(op, 'planned', now)
            elif command == 'await_approval':
                require(status == 'io_running' and data.get('request_id') == op['request_id'] and data.get('evidence'), 'Same submitted request and explicit approval-wait evidence required')
                op.setdefault('evidence', []).append(data['evidence'])
                transition(op, 'approval_pending', now)
            elif command in {'deny', 'uncertain'}:
                require(status in ACTIVE and data.get('evidence'), 'Active operation and evidence required')
                op.setdefault('evidence', []).append(data['evidence'])
                transition(op, 'denied' if command == 'deny' else 'uncertain_write', now)
            elif command == 'reconcile':
                evidence = data['evidence']
                require(status in ACTIVE | {'planned'}, 'Terminal operations cannot be reopened')
                require(evidence.get('read_only') is True and evidence.get('source') and evidence.get('checked_at'), 'Read-only remote evidence required')
                require(evidence.get('repository') == op['repository'] and evidence.get('kind') == op['kind'] and evidence.get('target') == op['target'], 'Wrong evidence target')
                if op['kind'] == 'commit':
                    require(len(evidence.get('remote_sha', '')) == 40, 'Verified commit SHA required')
                require(evidence.get('observed') == op['expected'], 'Remote evidence does not exactly match; remain blocked')
                op.setdefault('evidence', []).append(evidence)
                transition(op, 'succeeded', now)
            else:
                raise ValueError('Unknown command: ' + command)
    state['events'].append({'at': now, 'command': command, 'owner': owner, 'data': data})
    return report(state, now)


def report(state, now=None):
    now = time.time() if now is None else now
    rows = []
    for op in state['operations'].values():
        elapsed = {}
        for i, event in enumerate(op['history']):
            end = op['history'][i + 1]['at'] if i + 1 < len(op['history']) else now
            if event['status'] not in {'succeeded', 'denied', 'no_effect'}:
                elapsed[event['status']] = elapsed.get(event['status'], 0) + max(0, end - event['at'])
        rows.append({'id': op['id'], 'lane': op['lane'], 'kind': op['kind'], 'status': op['status'],
            'elapsed_seconds': elapsed, 'overdue': op['status'] in ACTIVE and now >= op['deadline_at']})
    return {'owner': state['owner'], 'operations': rows, 'production_blockers': [r['id'] for r in rows if r['lane'] == 'production' and r['status'] != 'succeeded'],
        'longest_production_phase': max(({'id': r['id'], 'phase': p, 'seconds': seconds} for r in rows if r['lane'] == 'production' for p, seconds in r['elapsed_seconds'].items()), key=lambda x: x['seconds'], default=None),
        'note': 'Observed phase durations, not an inferred dependency critical path. Deadlines never cancel tools.'}



def summarize(state, result, limit=10):
    """Bound stdout, not the durable journal; account for every omitted status."""
    require(0 <= limit <= 100, 'Summary limit must be 0..100')
    counts = {}
    for op in state['operations'].values():
        counts[op['status']] = counts.get(op['status'], 0) + 1
    # Success history never crowds out current problems. Unknown states remain visible.
    priority = {'denied': 0, 'uncertain_write': 1, 'approval_pending': 2,
                'io_running': 3, 'no_effect': 4, 'planned': 5}
    attention = sorted((op for op in state['operations'].values() if op['status'] != 'succeeded'),
                       key=lambda op: (priority.get(op['status'], -1), op['created_at'], op['id']))
    shown = attention[:limit]
    omitted = dict(counts)
    for op in shown:
        omitted[op['status']] -= 1
    summary = {
        'output': 'summary', 'owner': state['owner'],
        'operation_count': len(state['operations']), 'counts_by_status': counts,
        'attention_count': len(attention), 'attention_limit': limit,
        'overdue_attention_count': sum(op['status'] in ACTIVE and time.time() >= op['deadline_at'] for op in attention),
        'attention': [{key: op[key] for key in ('id', 'lane', 'kind', 'status')} for op in shown],
        'omitted_operation_count': len(state['operations']) - len(shown),
        'omitted_by_status': {key: count for key, count in omitted.items() if count},
        'omitted_attention_count': len(attention) - len(shown),
        'production_blocker_count': sum(op['lane'] == 'production' and op['status'] != 'succeeded'
                                        for op in state['operations'].values()),
        'note': 'Display only. Full operations, evidence and history remain in the journal. Omitted attention is not resolved.'}
    if 'id' in result:  # Keep the operation handle returned by plan.
        summary['operation'] = {key: result[key] for key in ('id', 'status')}
    elif 'publication_verified' in result:
        summary['receipt_result'] = result
    return summary


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('journal', help='One shared durable path for ALL publishers/worktrees')
    parser.add_argument('command', choices=['acquire', 'recover', 'release', 'plan', 'pending', 'begin', 'await_approval', 'end_no_effect', 'retry', 'deny', 'uncertain', 'reconcile', 'tick', 'report', 'receipt'])
    parser.add_argument('--owner', default='')
    parser.add_argument('--summary', action='store_true', help='Bound stdout with status counts and a limited attention list; journal remains complete')
    parser.add_argument('--summary-limit', type=int, default=10, metavar='N', help='Attention rows in summary, 0..100 (default: 10)')
    parser.add_argument('--input', help='JSON input path; never include credentials')
    args = parser.parse_args()
    if not 0 <= args.summary_limit <= 100:
        parser.error('--summary-limit must be 0..100')
    data = json.loads(Path(args.input).read_text()) if args.input else {}
    try:
        with transaction(args.journal) as state:
            result = report(state) if args.command == 'report' else act(state, args.command, data, args.owner)
            if args.summary:
                result = summarize(state, result, args.summary_limit)
        print(json.dumps(result, separators=(',', ':')) if args.summary else json.dumps(result, indent=2))
    except (ValueError, KeyError) as error:
        parser.exit(2, str(error) + '\n')


if __name__ == '__main__':
    main()
