package {{meta.group}}.item;

import net.minecraft.world.item.Tier;
import net.minecraft.world.item.crafting.Ingredient;

public class ModToolTiers {
    {{#each hubs.ModToolTiers.entries}}
    public static final Tier {{regField}} = new Tier() {
        @Override
        public int getUses() {
            return {{uses}};
        }

        @Override
        public float getSpeed() {
            return {{speed}}f;
        }

        @Override
        public float getAttackDamageBonus() {
            return {{damage}}f;
        }

        @Override
        public int getLevel() {
            return {{level}};
        }

        @Override
        public int getEnchantmentValue() {
            return {{enchantmentValue}};
        }

        @Override
        public Ingredient getRepairIngredient() {
            return Ingredient.of(ModItems.{{repairItemField}}.get());
        }
    };
    {{/each}}
}
