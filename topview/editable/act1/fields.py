"""Act I field authoring sheet. Coordinates are 180-unit navigational cells.
Named routes connect real mission sites. Ridge polygons are drop-offs (shot across);
crossings and stairs are explicit cut-outs. A route by itself never opens collision.
"""
from dataclasses import dataclass
@dataclass
class Field:
    title: str
    size: tuple
    places: dict
    roads: list
    drops: list
    water: list
    structures: list
    steps: list
    convoy: list
    actors: dict
    climate: str

def pts(value):
    return [tuple(map(float,p.split(','))) for p in value.split()]
def sites(value):
    return {p.split(':')[0]:pts(p.split(':')[1])[0] for p in value.split()}
def field(title,size,places,roads,drops,water,props,stairs,convoy,actors,climate):
    return Field(title,size,sites(places),roads.split('|'),[pts(s) for s in drops.split('|') if s],
                 [pts(s) for s in water.split('|') if s],[(p.split(':')[0],*pts(p.split(':')[1])[0]) for p in props.split()],
                 [pts(s) for s in stairs.split('|') if s],convoy.split(),dict(p.split(':') for p in actors.split()),climate)
FIELDS={
2:field('상여 위의 높은 길',(38,29),
'start:3,8 archerPerch:4,8 procession:3,20 leftBasin:13,21 rightBasin:25,20 rightShelf:30,9 exit:35,15 safeDescentUpper:12,10 safeDescentLower:9,17',
'start archerPerch 8,6 safeDescentUpper 17,7 24,5 rightShelf 33,11 exit|procession 7,22 leftBasin 18,18 21,18 rightBasin 30,18 exit|safeDescentUpper 10,13 safeDescentLower 10,20|rightBasin 28,15 26,12 rightShelf',
'0,10 3,11 8,12 9,14 5,16 0,15|13,11 17,9 22,8 25,10 23,13 18,14 15,15 12,14|28,12 32,11 35,12 33,14 29,15',
'0,26 8,24 15,25 24,23 30,22 38,20 38,29 0,29',
'lookout:5,7 ruin_gate:35.8,14.8 stone_lantern:2,18.5 cargo:12,23 boulder:24,15 guardtree:31,6',
'12,10 10,13 9,17|30,9 26,12 28,15','procession 7,22 leftBasin 18,18 21,18 rightBasin 30,18 exit',
'p-archer:start objective:procession ally-bokman:procession ally-baeksan:procession npc-damheo:procession npc-yeonsil:procession','ridge'),
3:field('서낭나루',(38,28),
'start:3,17 ferry:10,15 mudflat:16,21 cargo:23,13 ledger:32,10 roof:33,8 exit:36,8',
'start 6,19 ferry 13,18 mudflat 20,20 22,16 cargo 28,14 ledger exit|start 6,12 9,8 15,7 21,10 cargo|mudflat 23,23 30,21 33,16 ledger',
'0,3 8,1 17,2 16,4 10,5 7,7 2,8|25,5 30,2 38,1 38,5 35,6 29,6',
'0,24 7,18 11,19 13,21 17,24 23,26 29,25 38,22 38,28 0,28|10,13 12,11 17,10 19,12 18,14 16,16 14,16 13,14',
'hut:33.1,8.2 shed:22,11 cargo:23.4,12.8 cargo:25,15 broken_pier:10.4,16.8 stone_lantern:5,12 bridgepost:14,19',
'20,10 21,12 23,13|30,21 32,18 33,16','',
'p-archer:start p-mage:start midboss-stage3:mudflat npc-hwigyeom:cargo ledger:ledger','ferry'),
4:field('문 밖에 남은 사람들',(37,29),
'start:10,16 gate:10,14 leftLane:7,22 cartChoke:19,16 rightLane:30,12 exit:4,8 watch:28,6 westVantage:12,8',
'leftLane 6,18 gate 14,14 cartChoke 24,14 rightLane 34,14|leftLane 14,23 22,21 26,17 rightLane|gate westVantage 18,6 23,8 watch 32,8 rightLane|gate 7,11 exit',
'0,0 22,0 19,3 14,5 8,5 3,7 0,9|13,18 18,17 21,18 18,20 14,20|25,8 27,8 29,9 27,10 24,10',
'0,24 5,25 14,27 24,24 30,21 37,21 37,29 0,29',
'lookout:28.4,5.0 grain_cart:18.6,15.1 hut:4,6.2 shed:8,9 stone_lantern:11.5,13 ruin_gate:3.4,7',
'12,8 11,10 10,13|28,6 30,8 30,11','',
'p-archer:start p-mage:start objective:gate npc-hwigyeom:gate npc-chunrye:exit','palisade'),
5:field('폭포 틈의 한 발',(39,30),
'start:3,18 upperEntry:9,10 upperShot:24,10 shotGap:24,10 roost:20,7 lowerApproach:11,21 shoreShot:22,16 basin:20,21 receiver:25,20 ritualWest:24.5,20 ritualEast:25.5,20 waterfallFoot:28,15 cleat:29,10 exit:25,20',
'start 5,14 upperEntry 14,8 roost upperShot|start 6,21 lowerApproach 16,23 basin receiver|upperEntry 13,13 16,17 shoreShot 23,18 receiver|basin 19,18 shoreShot 21,13 upperShot|receiver 29,21 33,18 34,13 32,10',
'0,4 8,2 15,2 14,5 10,7 4,9 0,10|11,11 15,10 19,10 18,13 15,15 12,14|30,5 36,3 39,3 39,13 34,11 31,10',
'25,11 27,8 28.2,6 30,7 29.2,11 31,14 32,16 30,18 27,17 25,15|0,26 10,25 19,26 26,24 31,22 39,23 39,30 0,30',
'lookout:24,8.5 altar:25.7,19.1 guardtree:20.8,6.0 boulder:29.9,9.5 broken_pier:8,10.5 stone_lantern:24,21',
'9,10 11,12 13,13|21,13 23,11 24,10','',
'p-archer:start p-mage:start receiver-5:receiver cliff-cleat:cleat','fall'),
6:field('끊어진 나무다리',(42,30),
'start:3,11 westHead:9,15 westDeck:11,11 midDeck:18,11 pillarNest:21,18 rescue:25,21 eastHead:31,16 exit:39,11',
'start 6,10 westDeck 15,9 midDeck|start 5,14 westHead 12,18 16,21 pillarNest rescue 28,19 eastHead 35,15 exit|westHead 9,20 13,24 20,25 rescue|eastHead 30,12 34,9 exit',
'12,11 16,10 20,9 25,9 28,11 26,14 23,16 19,17 15,15 11,14|31,4 37,3 42,3 42,8 37,7 33,8',
'0,25 9,24 16,27 24,25 29,22 34,22 42,20 42,30 0,30',
'broken_pier:12,12 broken_pier:18.5,12.4 broken_pier:27,11.5 lookout:8,9 shed:39.8,9.5 ruin_gate:38.6,11 stone_lantern:24,22',
'9,15 11,17 13,19|31,16 30,14 30,12','rescue 28,19 eastHead 35,15 exit',
'p-archer:start p-mage:start p-knight:start objective:rescue ally-ropeguard:westHead midboss-stage6:pillarNest marker-7:exit','ravine'),
7:field('돌당골',(38,33),
'start:3,25 resident1:9,24 knot1:13,23 turn1:19,18 resident2:28,18 hollow:26,20 resident3:22,8 upperShrine:24,6 exit:31,7',
'start 6,26 resident1 knot1 16,20 turn1 23,17 resident2|resident1 9,19 10,15 14,12 18,11 resident3 upperShrine|turn1 17,15 18,11|hollow 30,20 33,16 30,12 26,10 resident3|resident2 30,15 31,10 exit',
'0,6 7,5 13,5 16,7 14,9 8,11 4,13 0,14|12,16 15,14 16,16 15,19 12,20|20,12 24,11 28,13 27,15 23,15 20,16',
'0,29 9,28 14,29 22,26 29,24 38,21 38,33 0,33',
'hut:8,23 hut:28.8,16.4 hut:21,6.5 guardtree:24.5,5.4 shrine:26,6.8 cargo:8,25.7 stone_lantern:14,12.9',
'10,15 14,12 18,11|17,15 18,11 22,8|30,15 31,12 31,10','',
'p-archer:start p-mage:start p-knight:start resident-1:resident1 resident-2:resident2 resident-3:resident3 resident-marker-1:resident1 resident-marker-2:resident2 resident-marker-3:resident3','village'),
8:field('돌아오는 빈 상여',(54,34),
'start:3,22 spawn:3,22 store:12,18 knotWest:16,16 courtyard:32,23 storeHollow:24,24 knotEast:44,13 bier:48,12 exit:51,17',
'start 8,22 store knotWest 20,18 24,21 courtyard 38,22 43,19 knotEast bier exit|store 11,13 16,10 25,9 33,12 38,13 knotEast|start 8,26 17,27 storeHollow courtyard|courtyard 35,25 42,25 48,21 exit',
'18,12 23,11 29,12 32,15 29,17 24,16 20,15|0,3 15,3 22,4 19,6 12,7 6,9 0,8|39,15 41,15 42,16 40,18 38,18',
'0,30 11,29 22,31 33,29 40,28 47,27 54,25 54,34 0,34',
'shed:11.3,16 shed:13.5,12 cargo:14.2,16.9 shrine:46,9.5 guardtree:36.9,19 ruin_gate:51,15 boulder:20,13.8',
'16,16 18,17 20,18|44,13 43,16 43,19','bier 47,15 43,19 38,22 courtyard',
'p-archer:start p-mage:start p-knight:start bier-knot-0:knotWest bier-knot-1:knotEast boss:bier','store'),
9:field('바람 없는 마당',(36,30),
'start:4,20 receiverWest:10,16 well:18,15 receiverEast:27,12 sodan:31,9 exit:33,8 lookout:18,8',
'start 6,17 receiverWest 14,18 20,18 23,16 receiverEast 30,12 sodan exit|receiverWest 10,12 14,9 lookout 23,8 receiverEast|start 10,23 18,24 25,21 29,18 receiverEast',
'0,3 7,2 14,3 12,6 7,7 2,10 0,9|14,12 17,10 19,11 18,13 15,14|22,19 24,18 25,19 23,21',
'30,20 32,17 36,15 36,24 32,24',
'well:18,15 altar:9.3,15.1 altar:27.7,11.1 hut:6,13 hut:30,7 lookout:18.6,7 ruin_gate:33.5,8 stone_lantern:22,17',
'14,9 12,11 10,13|23,8 25,10 27,12','',
'p-archer:start p-mage:start p-knight:start receiver-west:receiverWest receiver-east:receiverEast npc-sodan:sodan','still'),
10:field('소단 — 놓지 못한 밤',(41,32),
'start:4,22 receiverWest:11,17 westHall:13,11 ritual:21,15 altar:21,12 eastHall:29,11 receiverEast:32,17 outerEast:35,20 exit:38,21',
'start 7,20 receiverWest 16,16 ritual 26,16 receiverEast outerEast exit|receiverWest westHall 17,10 altar 25,10 eastHall receiverEast|start 12,24 20,24 27,23 outerEast|ritual 21,19 20,24',
'0,2 11,2 17,3 15,6 10,6 6,9 0,10|26,3 34,2 41,2 41,8 34,7 29,7|13,19 15,18 17,19 16,21 13,21|25,19 27,18 29,19 28,21 26,21',
'0,27 9,26 17,28 24,27 33,25 41,25 41,32 0,32',
'shrine:12.9,9.4 shrine:29.1,9.4 altar:21.3,10.7 guardtree:20,12.1 ruin_gate:36.9,20 stone_lantern:10.7,15.4 stone_lantern:32.3,15.4',
'13,11 12,14 11,17|29,11 30,14 32,17','ritual 26,16 receiverEast outerEast exit',
'p-archer:start p-mage:start p-knight:start boss:ritual sodan-binding:altar receiver-west:receiverWest receiver-east:receiverEast','ritual')
}
