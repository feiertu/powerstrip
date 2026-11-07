package {{meta.group}}.compat;

import {{meta.group}}.{{meta.mainClass}};
import {{meta.group}}.block.ModBlocks;
import {{meta.group}}.item.ModItems;
import mezz.jei.api.IModPlugin;
import mezz.jei.api.JeiPlugin;
import mezz.jei.api.registration.IRecipeRegistration;
import net.minecraft.network.chat.Component;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.world.item.ItemStack;

@JeiPlugin
public class {{params.className}} implements IModPlugin {
    @Override
    public ResourceLocation getPluginUid() {
        return new ResourceLocation({{meta.mainClass}}.MOD_ID, "jei_plugin");
    }

    @Override
    public void registerRecipes(IRecipeRegistration registration) {
        {{#each params.infoItemsExprs}}
        registration.addIngredientInfo(new ItemStack({{expr}}), ItemStack.class, Component.literal("{{params.infoText}}"));
        {{/each}}
    }
}
