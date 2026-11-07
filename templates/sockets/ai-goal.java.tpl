package {{meta.group}}.entity.ai;

import {{meta.group}}.entity.custom.{{params.entityClassName}};
import net.minecraft.world.entity.ai.goal.Goal;

public class {{params.goalClassName}} extends Goal {
    private final {{params.entityClassName}} entity;
    private final double speedModifier;
    private int attackTime = 0;

    public {{params.goalClassName}}({{params.entityClassName}} entity, double speedModifier, boolean aggressive) {
        this.entity = entity;
        this.speedModifier = speedModifier;
    }

    @Override
    public boolean canUse() {
        return this.entity.getTarget() != null;
    }

    @Override
    public void start() {
        this.attackTime = 0;
    }

    @Override
    public void tick() {
        if (this.entity.getTarget() != null) {
            this.entity.getNavigation().moveTo(this.entity.getTarget(), this.speedModifier);
            this.attackTime = Math.max(this.attackTime - 1, 0);
            if (this.attackTime == 0 && this.entity.distanceToSqr(this.entity.getTarget()) < 2.5D) {
                this.entity.doHurtTarget(this.entity.getTarget());
                this.attackTime = 20;
            }
        }
    }
}
