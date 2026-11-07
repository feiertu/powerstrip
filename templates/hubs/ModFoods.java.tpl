package {{meta.group}}.item;

import net.minecraft.world.food.FoodProperties;

public class ModFoods {
    {{#each hubs.ModFoods.entries}}
    public static final FoodProperties {{regField}} = new FoodProperties.Builder()
            .nutrition({{nutrition}}){{#if saturationMod}}.saturationMod({{saturationMod}}f){{/if}}{{#if meat}}.meat(){{/if}}.build();
    {{/each}}
}
