"""Produce the P00 roster and contact CSV from captured browser outputs."""
import argparse
import csv
import json
import sys
from pathlib import Path


def actor(snapshot):
    return next(u for u in snapshot["units"] if u["id"] == snapshot["active"])


def rows(directory, case):
    for source in sorted(directory.glob("stage-*.json")):
        record = json.loads(source.read_text())
        if record["status"] != "PASS":
            raise ValueError(f"Missing measurable entry: {source}")
        entry = record["entry"]
        # The Stage 52 mission owner requires cliff-stone to be a fixed shot target.
        exclude = {"cliff-stone"} if record["stage"] == 52 else set()
        hostile = {u["id"] for u in entry["units"] if u["side"] == 1 and not u["objective"]
                   and not u["summoned"] and not u["ally"]}
        trace = record["trace"]
        samples = [e for e in trace if e["type"] == "sample"]
        appeared = set().union(*(e["newIds"] for e in samples)) - exclude
        max_active = max(len(set(e["active"]) - exclude) for e in samples)
        fired = {e["owner"] for e in trace if e["type"] == "fire"} - exclude
        hit = {e["owner"] for e in trace if e["type"] == "hit"} - exclude
        start_allies = [u for u in record["settled"]["units"] if u["side"] == 0 and not u["ally"]
                        and not u["summoned"]]
        movement = next((e for e in record["input"] if e["key"] == "ArrowRight"), None)
        jump = next((e for e in record["input"] if e["key"] == "Control"), None)
        yield {
            "case": case, "stage": record["stage"], "rng_at_entry": entry["rng"],
            "round_start": entry["round"], "round_end": record["end"]["round"],
            "end_phase": record["end"]["phase"], "defend_inputs": record["defendInputs"],
            "side_1_rows": len(hostile), "attack_start": len(hostile-exclude),
            "attack_appeared_observed": len(appeared), "combat_active_max_observed": max_active,
            "actual_fired": len(fired), "actual_hit": len(hit), "actual_any": len(fired|hit),
            "actual_ids": "|".join(sorted(fired|hit)), "play_w": entry["play"][0], "play_h": entry["play"][1],
            "terrain_records": len(entry["terrain"]), "world_terrain_records": len(entry["worldTerrain"]),
            "hero_count": len(start_allies),
            "settled_valid_contacts": sum(u["grounded"] and u["validContact"] for u in start_allies),
            "supports": "|".join(sorted({u["support"] for u in start_allies if u["support"]})),
            "move_dx": round(actor(movement["after"])["pos"][0]-actor(movement["before"])["pos"][0],2) if movement else "",
            "jump_held_dy": round(actor(jump["held"])["pos"][1]-actor(jump["before"])["pos"][1],2) if jump else "",
            "jump_landed": actor(jump["after"])["grounded"] if jump else "",
            "isolated_save_unchanged": record["save"]["unchanged"]
        }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("entries", type=Path)
    parser.add_argument("focus", type=Path)
    args = parser.parse_args()
    records = [*rows(args.entries, "entry_defend"), *rows(args.focus, "focused")]
    writer = csv.DictWriter(sys.stdout, fieldnames=records[0], lineterminator="\n")
    writer.writeheader()
    writer.writerows(records)


if __name__ == "__main__":
    main()
