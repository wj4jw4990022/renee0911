# 輸出所有斜角建築：python3 export.py <輸出資料夾>
import sys, os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
import bld as B, sheet
out=sys.argv[1]; os.makedirs(out,exist_ok=True)
items={
 'village/mayor':B.mayor(),'village/arena':B.arena(),'village/temple':B.temple(),'village/clinic':B.clinic(),'village/inn':B.inn(),
 'village/plaza':B.plaza(),'village/tavern':B.tavern(),'village/guild':B.guild(),'village/smith':B.smith(),
 'village/house_0':B.house('r'),'village/house_1':B.house('bl'),'village/house_2':B.house('gr'),'village/house_3':B.house('br'),
 'village/shop_0':B.house('r',shop='au'),'village/shop_1':B.house('bl',shop='bl'),'village/shop_2':B.house('gr',shop='r'),'village/shop_3':B.house('br',shop='gr'),
 'village/stable':B.stable(),'village/station':B.station(),'village/telepad':B.telepad(),'village/telepad_lot':B.telepad(False),'village/gate':B.gate(),
 'village/office_1_local':B.office('地方'),'village/office_2_capital':B.office('王都'),'village/office_3_kingdom':B.office('王國'),'village/office_4_continent':B.office('大陸'),'village/office_dark':B.office('地下'),
 'village/home_0_rent':B.home('租屋'),'village/home_1_own':B.home('買房'),'village/home_2_married':B.home('結婚'),'village/home_3_kid':B.home('有小孩'),
 'capital/castle':B.castle(),'capital/house_0':B.cap_house('r'),'capital/house_1':B.cap_house('bl'),'capital/station':B.cap_station(),
}
for k,im in items.items():
    p=os.path.join(out,k+'.png'); os.makedirs(os.path.dirname(p),exist_ok=True); im.save(p)
    print(k, im.size)
