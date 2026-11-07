package {{meta.group}}.worldgen.portal;

import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraftforge.common.util.ITeleporter;

import java.util.function.Function;

public class {{params.teleporterClassName}} implements ITeleporter {
    public static BlockPos thisPos = BlockPos.ZERO;
    public static boolean insideDimension = true;

    public {{params.teleporterClassName}}(BlockPos pos, boolean insideDim) {
        thisPos = pos;
        insideDimension = insideDim;
    }

    @Override
    public Entity placeEntity(Entity entity, ServerLevel currentWorld, ServerLevel destinationWorld,
                              float yaw, Function<Boolean, Entity> repositionEntity) {
        entity = repositionEntity.apply(false);
        int y = 61;
        if (!insideDimension) {
            y = thisPos.getY();
        }
        BlockPos destinationPos = new BlockPos(thisPos.getX(), y, thisPos.getZ());
        entity.setPos(destinationPos.getX() + 0.5, destinationPos.getY(), destinationPos.getZ() + 0.5);
        return entity;
    }
}
