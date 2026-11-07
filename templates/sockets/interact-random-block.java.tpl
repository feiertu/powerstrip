package {{meta.group}}.block.custom;

import net.minecraft.core.BlockPos;
import net.minecraft.network.chat.Component;
import net.minecraft.world.InteractionHand;
import net.minecraft.world.InteractionResult;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.Items;
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
        if (!pLevel.isClientSide() && pHand == InteractionHand.MAIN_HAND) {
            outputRandomNumber(pPlayer, pLevel, pPos);
        }
        return InteractionResult.SUCCESS;
    }

    private void outputRandomNumber(Player pPlayer, Level pLevel, BlockPos pPos) {
        int randomNumber = pLevel.random.nextInt({{params.maxNumber}}) + 1;
        pPlayer.sendSystemMessage(Component.literal("Rolled: " + randomNumber));
        if (randomNumber == {{params.luckyNumber}}) {
            popResource(pLevel, pPos, new ItemStack(Items.{{params.luckyItem}}, 1));
            pPlayer.giveExperiencePoints({{params.xpAmount}});
            pPlayer.sendSystemMessage(Component.literal("Lucky!"));
        }
    }
}
