package {{meta.group}}.networking.packet;

import {{meta.group}}.block.entity.custom.{{params.beClassName}};
import net.minecraft.core.BlockPos;
import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraftforge.network.NetworkEvent;

import java.util.function.Supplier;

public class {{params.beClassName}}C2SPacket {
    private final BlockPos pos;
    private final int action;

    public {{params.beClassName}}C2SPacket(BlockPos pos, int action) {
        this.pos = pos;
        this.action = action;
    }

    public static void encode({{params.beClassName}}C2SPacket msg, FriendlyByteBuf buf) {
        buf.writeBlockPos(msg.pos);
        buf.writeVarInt(msg.action);
    }

    public static {{params.beClassName}}C2SPacket decode(FriendlyByteBuf buf) {
        return new {{params.beClassName}}C2SPacket(buf.readBlockPos(), buf.readVarInt());
    }

    public static void handle({{params.beClassName}}C2SPacket msg, Supplier<NetworkEvent.Context> ctx) {
        ctx.get().enqueueWork(() -> {
            if (ctx.get().getSender() == null) return;
            Level level = ctx.get().getSender().level();
            BlockEntity be = level.getBlockEntity(msg.pos);
            if (be instanceof {{params.beClassName}} machine) {
                machine.handlePacketAction(msg.action);
            }
        });
        ctx.get().setPacketHandled(true);
    }
}
