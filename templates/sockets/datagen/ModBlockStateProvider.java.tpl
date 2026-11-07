package {{meta.group}}.datagen;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
import net.minecraft.data.PackOutput;
import net.minecraftforge.client.model.generators.BlockStateProvider;
import net.minecraftforge.common.data.ExistingFileHelper;

public class ModBlockStateProvider extends BlockStateProvider {
    public ModBlockStateProvider(PackOutput output, ExistingFileHelper exFileHelper) {
        super(output, {{meta.mainClass}}.MOD_ID, exFileHelper);
    }

    @Override
    protected void registerStatesAndModels() {
        {{#each params.simpleCubeBlocks}}
        blockWithItem(ModBlocks.{{this}}.get());
        {{/each}}
    }
}
