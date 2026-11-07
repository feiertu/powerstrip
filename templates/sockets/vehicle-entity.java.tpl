package {{meta.group}}.entity.custom;

import {{meta.group}}.entity.ModEntities;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.vehicle.Boat;
import net.minecraft.world.level.Level;

public class {{params.className}} extends Boat {
    public {{params.className}}(EntityType<? extends Boat> pEntityType, Level pLevel) {
        super(pEntityType, pLevel);
    }

    public {{params.className}}(Level pLevel, double pX, double pY, double pZ) {
        this(ModEntities.{{params.regField}}.get(), pLevel);
        this.setPos(pX, pY, pZ);
        this.xo = pX;
        this.yo = pY;
        this.zo = pZ;
    }
}
