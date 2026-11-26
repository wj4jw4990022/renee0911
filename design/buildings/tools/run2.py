import sys; import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bld, sheet
B=bld
rows=[('村子 左→右',[('村長家',B.mayor()),('鬥技場',B.arena()),('神殿',B.temple()),('藥局',B.clinic()),('旅館',B.inn()),('廣場',B.plaza()),('事務所',B.office('地方')),('酒館',B.tavern()),('冒險者公會',B.guild()),('鐵匠鋪',B.smith())]),
 ('',[('民宅',B.house('r')),('民宅',B.house('bl')),('民宅',B.house('gr')),('民宅',B.house('br')),('勇者的家',B.home('租屋')),('馬廄',B.stable()),('驛馬車站',B.station()),('傳送陣',B.telepad()),('村口',B.gate())]),
 ('民宅→店面',[('雜貨',B.house('r',shop='au')),('服飾',B.house('bl',shop='bl')),('肉舖',B.house('gr',shop='r')),('花店',B.house('br',shop='gr')),('傳送陣預定地',B.telepad(False))]),
 ('事務所',[('地方',B.office('地方')),('王都',B.office('王都')),('王國',B.office('王國')),('大陸',B.office('大陸')),('惡名（地下）',B.office('地下'))]),
 ('勇者的家',[('租屋',B.home('租屋')),('買房',B.home('買房')),('結婚',B.home('結婚')),('有小孩',B.home('有小孩'))]),
 ('王都',[('城堡',B.castle()),('民房',B.cap_house('r')),('民房',B.cap_house('bl')),('驛站',B.cap_station())]),
]
sheet.sheet(rows,sys.argv[1],S=3,title='斜角建築 v1（Kenney 配色／外框，右邊是勇者）')
