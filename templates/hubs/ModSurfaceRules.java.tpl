package {{meta.group}}.worldgen.biome.surface;

import net.minecraft.world.level.block.Block;
import net.minecraft.world.level.block.Blocks;
import net.minecraft.world.level.levelgen.SurfaceRules;

public class ModSurfaceRules {
    private static final SurfaceRules.RuleSource DIRT = makeStateRule(Blocks.DIRT);
    {{#each hubs.ModSurfaceRules.entries}}
    private static final SurfaceRules.RuleSource {{ruleField}} = makeStateRule(Blocks.{{blockVanilla}});
    {{/each}}

    public static SurfaceRules.RuleSource makeRules() {
        SurfaceRules.ConditionSource isAtOrAboveWaterLevel = SurfaceRules.waterBlockCheck(-1, 0);
        SurfaceRules.RuleSource grassSurface = SurfaceRules.sequence(SurfaceRules.ifTrue(isAtOrAboveWaterLevel,
                makeStateRule(Blocks.GRASS_BLOCK)), DIRT);

        return SurfaceRules.sequence(
                {{#each hubs.ModSurfaceRules.entries}}
                SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, {{ruleField}}),
                {{/each}}
                SurfaceRules.ifTrue(SurfaceRules.ON_FLOOR, grassSurface)
        );
    }

    private static SurfaceRules.RuleSource makeStateRule(Block block) {
        return SurfaceRules.state(block.defaultBlockState());
    }
}
