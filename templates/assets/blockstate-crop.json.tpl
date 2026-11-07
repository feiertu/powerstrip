{
  "variants": {
    {{#each ages}}"age={{this}}": { "model": "{{meta.modId}}:block/{{params.regPath}}_stage{{this}}" }{{#unless @last}},
    {{/unless}}{{/each}}
  }
}
