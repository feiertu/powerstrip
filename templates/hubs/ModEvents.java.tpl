package {{meta.group}}.event;

import {{meta.group}}.{{meta.mainClass}};
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.fml.common.Mod;

@Mod.EventBusSubscriber(modid = {{meta.mainClass}}.MOD_ID, bus = Mod.EventBusSubscriber.Bus.FORGE)
public class ModEvents {
    @SubscribeEvent
    public static void onServerStarting(ServerStartingEvent event) {
        // FORGE 总线事件挂点（事件监听插座 50 拆分而来）
    }
}
