package {{meta.group}}.item.custom;

import {{meta.group}}.item.ModArmorMaterials;
import net.minecraft.world.item.ArmorItem;
import net.minecraft.world.item.ArmorMaterial;

public class {{params.className}} extends ArmorItem {
    public {{params.className}}(ArmorItem.Type pType, Properties pProperties) {
        super(ModArmorMaterials.{{params.materialRegField}}, pType, pProperties);
    }
}
