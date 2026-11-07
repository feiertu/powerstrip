package {{meta.group}}.entity.custom;

import {{meta.group}}.entity.ModEntities;
import {{meta.group}}.item.ModItems;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.projectile.ThrowableItemProjectile;
import net.minecraft.world.item.Item;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.EntityHitResult;

public class {{params.className}} extends ThrowableItemProjectile {
    public {{params.className}}(EntityType<? extends ThrowableItemProjectile> pEntityType, Level pLevel) {
        super(pEntityType, pLevel);
    }

    public {{params.className}}(Level pLevel, LivingEntity livingEntity) {
        super(ModEntities.{{params.regField}}.get(), livingEntity, pLevel);
    }

    @Override
    protected Item getDefaultItem() {
        return ModItems.{{params.itemRegField}}.get();
    }

    @Override
    protected void onHitEntity(EntityHitResult pResult) {
        if (!this.level().isClientSide()) {
            Entity entity = pResult.getEntity();
            Entity entity1 = this.getOwner();
            if (entity1 instanceof LivingEntity livingentity) {
                entity.hurt(this.damageSources().thrown(this, entity1), {{params.damage}}f);
            }
        }
        super.onHitEntity(pResult);
    }
}
