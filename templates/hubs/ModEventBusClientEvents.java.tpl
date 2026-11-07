package {{meta.group}}.event;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraftforge.api.distmarker.Dist;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.fml.event.lifecycle.FMLClientSetupEvent;

@Mod.EventBusSubscriber(modid = {{meta.mainClass}}.MOD_ID, bus = Mod.EventBusSubscriber.Bus.MOD, value = Dist.CLIENT)
public class ModEventBusClientEvents {
    @SubscribeEvent
    public static void onClientSetup(FMLClientSetupEvent event) {
        // 客户端事件挂点：渲染器/界面注册在主类的 ClientModEvents，此处留给自定义客户端逻辑
    }
}
