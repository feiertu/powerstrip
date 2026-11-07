package {{meta.group}}.item.custom;

import {{meta.group}}.util.ModTags;
import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResultHolder;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.level.Level;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.state.BlockState;

public class {{params.className}} extends Item {
    public {{params.className}}(Properties pProperties) {
        super(pProperties);
    }

    @Override
    public InteractionResultHolder<ItemStack> use(Level pLevel, Player pPlayer, InteractionHand pUsedHand) {
        if (!pLevel.isClientSide()) {
            BlockPos positionClicked = pPlayer.getOnPos();
            boolean foundBlock = false;

            for (int i = 0; i <= positionClicked.getY() + 64; i++) {
                BlockState blockState = pLevel.getBlockState(positionClicked.below(i));

                if (isValuableBlock(blockState)) {
                    outputValuableCoordinates(positionClicked.below(i), pPlayer, blockState.getBlock());
                    foundBlock = true;
                    break;
                }
            }

            if (!foundBlock) {
                pPlayer.sendSystemMessage(Component.literal("No valuables found!"));
            }
        }

        pPlayer.getCooldowns().addCooldown(this, 20);
        return InteractionResultHolder.sidedSuccess(pPlayer.getItemInHand(pUsedHand), pLevel.isClientSide());
    }

    private void outputValuableCoordinates(BlockPos pBlockPos, Player pPlayer, Block block) {
        pPlayer.sendSystemMessage(Component.literal("Found " + block.getName().getString() + " at (" +
                pBlockPos.getX() + ", " + pBlockPos.getY() + ", " + pBlockPos.getZ() + ")"));
    }

    private boolean isValuableBlock(BlockState pBlockState) {
        return pBlockState.is(ModTags.Blocks.{{params.tagRegField}});
    }
}
