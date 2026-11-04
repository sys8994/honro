"""QA observation memory only; never reads or changes game decisions.

Keep a conservative peak until two consecutive completed enemy responses have
no newly observed HP loss. Allied actions, waiting and repeated reads do not age
it. Unobserved response gaps do not count as confirmed quiet responses.
"""


class RecentIncomingDamage:
    def __init__(self):
        self.heroes = {}

    def observe(self, enemy_team_ends, health):
        if not isinstance(enemy_team_ends, int) or enemy_team_ends < 0:
            raise ValueError('Expected completed enemy response serial')
        result = {}
        for hero in health:
            uid, hp = hero['id'], hero['hp']
            previous = self.heroes.get(uid)
            if previous is None:
                current = dict(serial=enemy_team_ends, hp=hp, peak=0, quiet=0)
            else:
                delta = enemy_team_ends - previous['serial']
                if delta < 0:
                    raise ValueError('New battle requires new damage memory')
                current = {**previous, 'serial': enemy_team_ends, 'hp': hp}
                loss = max(0, previous['hp'] - hp)
                if loss:
                    current['peak'] = max(previous['peak'], loss)
                    current['quiet'] = 0
                elif delta == 1:
                    current['quiet'] += 1
                    if current['quiet'] >= 2:
                        current['peak'] = 0
                elif delta > 1:
                    current['quiet'] = 0
            self.heroes[uid] = current
            result[uid] = current['peak']
        return result
