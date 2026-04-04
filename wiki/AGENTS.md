# Agent Configuration

## Core Agents

### Strategist Agent
- **Role**: Strategic analysis, brief development, audience insight
- **Reads from**: patterns/, categories/, frameworks/, campaigns/
- **Writes to**: patterns/, categories/, frameworks/
- **Trigger**: Strategy queries, brief analysis, audience research

### Creative Agent
- **Role**: Idea generation, concept development, script writing
- **Reads from**: patterns/, categories/, brands/, playbooks/, campaigns/
- **Writes to**: patterns/, playbooks/
- **Trigger**: Creative generation, ideation, concept development

### Production Agent
- **Role**: Production planning, asset specification, delivery guidance
- **Reads from**: playbooks/, frameworks/, campaigns/, brands/
- **Writes to**: playbooks/, frameworks/
- **Trigger**: Production queries, asset specs, delivery planning

### Pattern Extractor Agent
- **Role**: Extract generalized insights from campaigns and outputs
- **Reads from**: campaigns/, brands/, raw memory
- **Writes to**: patterns/, categories/
- **Trigger**: After every ingest, after every evaluated output

### Lint Agent
- **Role**: Knowledge base health maintenance
- **Reads from**: ALL wiki directories
- **Writes to**: ALL wiki directories, log.md
- **Trigger**: Scheduled, or on-demand

## Agent Rules

1. Always read wiki BEFORE raw memory
2. Avoid recomputing known insights
3. Suggest write-back when output is reusable
4. Never store client-specific data in global patterns
5. Log all wiki mutations to log.md
