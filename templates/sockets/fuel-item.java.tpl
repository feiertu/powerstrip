package {{meta.group}}.item.custom;

import net.minecraft.world.item.Item;
import net.minecraft.world.item.ItemStack;

public class {{params.className}} extends Item {
    public {{params.className}}(Properties pProperties) {
        super(pProperties);
    }

    @Override
    public int getBurnTime(ItemStack itemStack) {
        return {{params.burnTime}};
    }
}
