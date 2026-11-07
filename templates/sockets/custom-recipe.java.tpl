package {{meta.group}}.recipe;

import com.google.gson.JsonObject;
{{#if features.recipeRegistryAccess}}import net.minecraft.core.RegistryAccess;
{{/if}}import net.minecraft.network.FriendlyByteBuf;
import net.minecraft.resources.ResourceLocation;
import net.minecraft.util.GsonHelper;
import net.minecraft.world.Container;
import net.minecraft.world.item.ItemStack;
import net.minecraft.world.item.crafting.Ingredient;
import net.minecraft.world.item.crafting.Recipe;
import net.minecraft.world.item.crafting.RecipeSerializer;
import net.minecraft.world.item.crafting.RecipeType;
import net.minecraft.world.item.crafting.ShapedRecipe;
import net.minecraft.world.level.Level;

public class {{params.recipeClassName}} implements Recipe<Container> {
    private final Ingredient inputItem;
    private final int inputCount;
    private final ItemStack output;

    public {{params.recipeClassName}}(Ingredient inputItem, int inputCount, ItemStack output) {
        this.inputItem = inputItem;
        this.inputCount = inputCount;
        this.output = output;
    }

    @Override
    public boolean matches(Container pContainer, Level pLevel) {
        if (pLevel.isClientSide()) {
            return false;
        }

        int count = 0;
        for (int i = 0; i < pContainer.getContainerSize(); i++) {
            if (inputItem.test(pContainer.getItem(i))) {
                count++;
            }
        }

        return count >= inputCount;
    }

    {{#if features.recipeRegistryAccess}}
    @Override
    public ItemStack assemble(Container pContainer, RegistryAccess pRegistryAccess) {
    {{else}}
    @Override
    public ItemStack assemble(Container pContainer) {
    {{/if}}
        return output.copy();
    }

    @Override
    public boolean canCraftInDimensions(int pWidth, int pHeight) {
        return true;
    }

    {{#if features.recipeRegistryAccess}}
    @Override
    public ItemStack getResultItem(RegistryAccess pRegistryAccess) {
    {{else}}
    @Override
    public ItemStack getResultItem() {
    {{/if}}
        return output.copy();
    }

    @Override
    public RecipeSerializer<?> getSerializer() {
        return Serializer.INSTANCE;
    }

    @Override
    public RecipeType<?> getType() {
        return Type.INSTANCE;
    }

    public static class Type implements RecipeType<{{params.recipeClassName}}> {
        private Type() { }
        public static final Type INSTANCE = new Type();
        public static final String ID = "{{params.recipeId}}";
    }

    public static class Serializer implements RecipeSerializer<{{params.recipeClassName}}> {
        public static final Serializer INSTANCE = new Serializer();
        public static final String ID = "{{params.recipeId}}";

        @Override
        public {{params.recipeClassName}} fromJson(ResourceLocation pRecipeId, JsonObject pSerializedRecipe) {
            Ingredient inputItem = Ingredient.fromJson(pSerializedRecipe.get("ingredient"));
            int inputCount = GsonHelper.getAsInt(pSerializedRecipe, "input_count");
            ItemStack output = ShapedRecipe.itemStackFromJson(GsonHelper.getAsJsonObject(pSerializedRecipe, "output"));

            return new {{params.recipeClassName}}(inputItem, inputCount, output);
        }

        @Override
        public {{params.recipeClassName}} fromNetwork(ResourceLocation pRecipeId, FriendlyByteBuf pBuffer) {
            Ingredient inputItem = Ingredient.fromNetwork(pBuffer);
            int inputCount = pBuffer.readVarInt();
            ItemStack output = pBuffer.readItem();

            return new {{params.recipeClassName}}(inputItem, inputCount, output);
        }

        @Override
        public void toNetwork(FriendlyByteBuf pBuffer, {{params.recipeClassName}} pRecipe) {
            pRecipe.inputItem.toNetwork(pBuffer);
            pBuffer.writeVarInt(pRecipe.inputCount);
            pBuffer.writeItem(pRecipe.output);
        }
    }
}
