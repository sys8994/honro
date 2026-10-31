SUPPORTED = frozenset(('state','key','hold','wheel','drag','wait','save','export','reload','stop'))
def validate_command(tokens):
    if not tokens or tokens[0] not in SUPPORTED:
        raise ValueError('Unsupported command: '+(' '.join(tokens) if tokens else '<empty>'))
    return tokens[0]
