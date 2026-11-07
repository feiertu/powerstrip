package {{meta.group}}.item.custom;

import {{meta.group}}.entity.custom.{{params.boatEntityClassName}};
import net.minecraft.core.BlockPos;
import net.minecraft.world.entity.vehicle.Boat;
import net.minecraft.world.item.BoatItem;
import net.minecraft.world.level.Level;

public class {{params.className}} extends BoatItem {
    public {{params.className}}(Properties pProperties) {
        super(pProperties);
    }

    @Override
    protected Boat getBoat(Level pLevel, BlockPos pPos) {
        return new {{params.boatEntityClassName}}(pLevel, pPos.getX(), pPos.getY(), pPos.getZ());
    }
}
