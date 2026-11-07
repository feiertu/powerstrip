package {{meta.group}}.datagen;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.item.ModItems;
import net.minecraft.data.PackOutput;
import net.minecraftforge.client.model.generators.ItemModelProvider;
import net.minecraftforge.common.data.ExistingFileHelper;

public class ModItemModelProvider extends ItemModelProvider {
    public ModItemModelProvider(PackOutput output, ExistingFileHelper existingFileHelper) {
        super(output, {{meta.mainClass}}.MOD_ID, existingFileHelper);
    }

    @Override
    protected void registerModels() {
        {{#each params.simpleItems}}
        basicItem(ModItems.{{this}}.get());
        {{/each}}{{#each params.handheldItems}}
        handheldItem(ModItems.{{this}}.get());
        {{/each}}
    }
}
