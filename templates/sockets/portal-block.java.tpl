package {{meta.group}}.block.custom;

import {{meta.group}}.worldgen.dimension.ModDimensions;
import {{meta.group}}.worldgen.portal.{{params.teleporterClassName}};
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.server.level.ServerPlayer;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.phys.BlockHitResult;

public class {{params.className}} extends Block {
    public {{params.className}}(Properties pProperties) {
        super(pProperties);
    }

    @Override
    public InteractionResult use(BlockState pState, Level pLevel, BlockPos pPos, Player pPlayer, InteractionHand pHand, BlockHitResult pHit) {
        if (pPlayer.canChangeDimensions()) {
            handlePortal(pPlayer, pPos);
            return InteractionResult.SUCCESS;
        } else {
            return InteractionResult.CONSUME;
        }
    }

    private void handlePortal(Entity pEntity, BlockPos pPos) {
        if (pEntity.level() instanceof ServerLevel serverLevel) {
            ServerLevel destination = serverLevel.getServer().getLevel(ModDimensions.{{params.dimLevelKeyField}});
            if (destination != null && !pEntity.isPassenger()) {
                pEntity.changeDimension(destination, new {{params.teleporterClassName}}(pPos, true));
            }
        }
    }
}
