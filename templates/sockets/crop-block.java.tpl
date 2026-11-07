package {{meta.group}}.block.custom;

import {{meta.group}}.item.ModItems;
import com.mojang.serialization.MapCodec;
import net.minecraft.world.level.ItemLike;
import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.CropBlock;
import net.minecraft.world.level.block.state.BlockState;
import net.minecraft.world.level.block.state.StateDefinition;
import net.minecraft.world.level.block.state.properties.IntegerProperty;

public class {{params.className}} extends CropBlock {
    public static final int MAX_AGE = {{params.maxAge}};
    public static final MapCodec<{{params.className}}> CODEC = simpleCodec({{params.className}}::new);

    public {{params.className}}(Properties pProperties) {
        super(pProperties);
    }

    @Override
    protected MapCodec<? extends CropBlock> codec() {
        return CODEC;
    }

    @Override
    protected ItemLike getBaseSeedId() {
        return ModItems.{{params.seedRegField}}.get();
    }

    @Override
    public IntegerProperty getAgeProperty() {
        return AGE;
    }

    @Override
    public int getMaxAge() {
        return MAX_AGE;
    }

    @Override
    protected void createBlockStateDefinition(StateDefinition.Builder<Block, BlockState> pBuilder) {
        pBuilder.add(AGE);
    }
}
