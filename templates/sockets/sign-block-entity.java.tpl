package {{meta.group}}.block.entity.custom;

import {{meta.group}}.block.entity.ModBlockEntities;
import net.minecraft.core.BlockPos;
import net.minecraft.world.level.block.entity.SignBlockEntity;
import net.minecraft.world.level.block.state.BlockState;

public class {{params.beClassName}} extends SignBlockEntity {
    public {{params.beClassName}}(BlockPos pPos, BlockState pBlockState) {
        super(ModBlockEntities.{{params.beRegField}}, pPos, pBlockState);
    }
}
