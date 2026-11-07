package {{meta.group}}.block.custom;

import {{meta.group}}.block.entity.custom.{{params.beClassName}};
import net.minecraft.core.BlockPos;
import net.minecraft.world.level.block.SignBlock;
import net.minecraft.world.level.block.entity.BlockEntity;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.properties.WoodType;

public class {{params.className}} extends SignBlock {
    public {{params.className}}(Properties pProperties, WoodType pWoodType) {
        super(pProperties, pWoodType);
    }

    @Override
    public BlockEntity newBlockEntity(BlockPos pPos, BlockState pState) {
        return new {{params.beClassName}}(pPos, pState);
    }
}
