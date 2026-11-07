package {{meta.group}}.recipe;

import {{meta.group}}.{{meta.mainClass}};
{{#each hubs.ModRecipes.serializers}}import {{meta.group}}.recipe.{{recipeClassName}};
{{/each}}
import net.minecraft.world.item.crafting.RecipeSerializer;
import net.minecraft.world.item.crafting.RecipeType;
import net.minecraftforge.eventbus.api.IEventBus;
import net.minecraftforge.registries.DeferredRegister;
import net.minecraftforge.registries.ForgeRegistries;
import net.minecraftforge.registries.RegistryObject;

public class ModRecipes {
    public static final DeferredRegister<RecipeSerializer<?>> SERIALIZERS =
            DeferredRegister.create(ForgeRegistries.RECIPE_SERIALIZERS, {{meta.mainClass}}.MOD_ID);
    public static final DeferredRegister<RecipeType<?>> TYPES =
            DeferredRegister.create(ForgeRegistries.RECIPE_TYPES, {{meta.mainClass}}.MOD_ID);

    {{#each hubs.ModRecipes.serializers}}
    public static final RegistryObject<RecipeSerializer<{{recipeClassName}}>> {{serializerField}} =
            SERIALIZERS.register("{{recipeId}}", () -> {{recipeClassName}}.Serializer.INSTANCE);
    {{/each}}
    {{#each hubs.ModRecipes.types}}
    public static final RegistryObject<RecipeType<{{recipeClassName}}>> {{typeField}} =
            TYPES.register("{{recipeId}}", () -> {{recipeClassName}}.Type.INSTANCE);
    {{/each}}

    public static void register(IEventBus eventBus) {
        SERIALIZERS.register(eventBus);
        TYPES.register(eventBus);
    }
}
