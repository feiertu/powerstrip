{
{{#each sounds}}  "{{regPath}}": {
    "subtitle": "subtitles.{{meta.modId}}.{{regPath}}",
    "sounds": [
      { "name": "{{meta.modId}}:{{regPath}}" }
    ]
  }{{#unless @last}},{{/unless}}
{{/each}}}
