"""Assess observed effects of the requested role, without mutating game state."""
def useful_role_effect(skill, enemy_damage, friendly_damage, friendly_healing):
    return friendly_damage == 0 and (friendly_healing > 0 if skill == 'O13' else enemy_damage > 0)

if __name__ == '__main__':
    assert useful_role_effect('O13', 0, 0, 323)
    assert not useful_role_effect('O13', 0, 0, 0)
    assert useful_role_effect('A02', 1465, 0, 0)
    assert not useful_role_effect('A02', 0, 0, 323)
    assert not useful_role_effect('A02', 1465, 1, 0)
    print('Observed attack/support outcome cases passed')
