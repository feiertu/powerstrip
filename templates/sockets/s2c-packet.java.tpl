package {{meta.group}}.networking.packet;

import net.minecraft.client.Minecraft;
import net.minecraft.core.BlockPos;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.network.chat.Component;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public class {{params.beClassName}}S2CPacket {
    private final BlockPos pos;

    public {{params.beClassName}}S2CPacket(BlockPos pos) {
        this.pos = pos;
    }

    public static void encode({{params.beClassName}}S2CPacket msg, FriendlyByteBuf buf) {
        buf.writeBlockPos(msg.pos);
    }

    public static {{params.beClassName}}S2CPacket decode(FriendlyByteBuf buf) {
        return new {{params.beClassName}}S2CPacket(buf.readBlockPos());
    }

    public static void handle({{params.beClassName}}S2CPacket msg, Supplier<NetworkEvent.Context> ctx) {
        ctx.get().enqueueWork(() -> {
            if (Minecraft.getInstance().player != null) {
                Minecraft.getInstance().player.sendSystemMessage(Component.literal("加工完成：" + msg.pos.toShortString()));
            }
        });
        ctx.get().setPacketHandled(true);
    }
}
