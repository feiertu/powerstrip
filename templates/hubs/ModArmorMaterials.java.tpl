package {{meta.group}}.item;

import net.minecraft.sounds.SoundEvent;
import net.minecraft.sounds.SoundEvents;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;
import net.minecraft.world.item.crafting.Ingredient;

public class ModArmorMaterials {
    {{#each hubs.ModArmorMaterials.entries}}
    public static final ArmorMaterial {{regField}} = new ArmorMaterial() {
        @Override
        public int getDurabilityForType(ArmorItem.Type pType) {
            return switch (pType) {
                case BOOTS -> 13;
                case LEGGINGS -> 15;
                case CHESTPLATE -> 16;
                case HELMET -> 11;
            } * {{durabilityMultiplier}};
        }

        @Override
        public int getDefenseForType(ArmorItem.Type pType) {
            return switch (pType) {
                case BOOTS -> {{defenseBoots}};
                case LEGGINGS -> {{defenseLeggings}};
                case CHESTPLATE -> {{defenseChestplate}};
                case HELMET -> {{defenseHelmet}};
            };
        }

        @Override
        public int getEnchantmentValue() {
            return {{enchantmentValue}};
        }

        @Override
        public SoundEvent getEquipSound() {
            return SoundEvents.ARMOR_EQUIP_DIAMOND;
        }

        @Override
        public Ingredient getRepairIngredient() {
            return Ingredient.of(ModItems.{{repairItemField}}.get());
        }

        @Override
        public String getName() {
            return "{{name}}";
        }

        @Override
        public float getToughness() {
            return {{toughness}}f;
        }

        @Override
        public float getKnockbackResistance() {
            return {{knockbackResistance}}f;
        }
    };
    {{/each}}
}
