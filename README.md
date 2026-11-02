# Nizlo MSP operations resources

Free, practical checklists for managed service providers and lean IT teams evaluating, deploying, operating, migrating, and offboarding remote monitoring and management software.

Every resource below is public, ungated, and written to be usable independently of Nizlo's product. The canonical guides include downloadable field templates where available.

## RMM selection and change

| Resource | Use it when |
| --- | --- |
| [RMM evaluation checklist](https://nizlo.com/guides/rmm-evaluation-checklist) | Comparing products through evidence rather than feature-list claims |
| [RMM vendor due-diligence checklist](https://nizlo.com/guides/rmm-vendor-due-diligence) | Comparing security, support, pilot evidence, pricing, commercial terms, and exit readiness |
| [RMM cost calculator and pricing dataset](https://nizlo.com/guides/cheapest-rmm-for-small-msps) | Comparing six source-dated public pricing models for a small MSP without giving up an email address |
| [RMM security checklist](https://nizlo.com/guides/rmm-security-checklist) | Reviewing device identity, tenant isolation, MFA, permissions, signed actions, audit logs, recovery, and removal |
| [RMM incident response checklist](https://nizlo.com/guides/rmm-incident-response-checklist) | Preparing independent control paths, scoping impact, containing access, preserving evidence, recovering safely, and reconciling endpoints |
| [RMM migration checklist](https://nizlo.com/guides/rmm-migration-checklist) | Planning discovery, pilot, coexistence, cutover, rollback, and cleanup |
| [RMM for Mac and Windows](https://nizlo.com/guides/rmm-for-mac-and-windows) | Evaluating enrollment, inventory, alerts, automation, updates, remote access, and removal across a mixed fleet |
| [RMM for a new MSP](https://nizlo.com/guides/rmm-for-new-msps) | Choosing a first platform without overcomplicating ticketing, endpoint control, pricing, or exit planning |
| [RMM for small IT teams](https://nizlo.com/guides/rmm-for-small-it-teams) | Deciding whether an internal IT team needs RMM, where Intune fits, and what to test in a safe pilot |
| [RMM pricing models](https://nizlo.com/guides/rmm-pricing-models) | Comparing per-device and per-technician pricing, tier effects, worked examples, and total-cost risks |
| [RMM vs. Microsoft Intune](https://nizlo.com/guides/rmm-vs-intune) | Comparing multi-tenant operations, monitoring, scripting, patching, application management, remote support, and cost |

## Client lifecycle

| Resource | Use it when |
| --- | --- |
| [MSP client onboarding checklist](https://nizlo.com/guides/msp-client-onboarding-checklist) | Establishing authority, scope, access, monitoring, patching, backup, and acceptance |
| [MSP client offboarding checklist](https://nizlo.com/guides/msp-client-offboarding-checklist) | Removing access and agents without losing evidence, ownership, or responsibility |

## Daily endpoint operations

| Resource | Use it when |
| --- | --- |
| [RMM automation safety checklist](https://nizlo.com/guides/rmm-automation-safety-checklist) | Reviewing targeting, privilege, rollout, rollback, evidence, and failure handling |
| [RMM alert-tuning checklist](https://nizlo.com/guides/rmm-alert-tuning-checklist) | Turning noisy endpoint signals into owned, actionable service work |
| [Endpoint exception-management guide](https://nizlo.com/guides/endpoint-exception-management) | Turning failed patches, offline devices, pending reboots, and unknown states into owned work |
| [Endpoint inventory and CMDB readiness checklist](https://nizlo.com/guides/endpoint-inventory-cmdb-readiness) | Establishing durable identities, source provenance, lifecycle states, and exception handling before a CMDB project |
| [Windows patch-management checklist](https://nizlo.com/guides/windows-patch-management-checklist) | Defining rings, maintenance windows, approvals, exceptions, rollback, and reporting |
| [RMM deployment checklist](https://nizlo.com/guides/rmm-deployment-checklist) | Moving from endpoint preparation through a controlled pilot, wave rollout, verification, and rollback |
| [RMM agent installation troubleshooting guide](https://nizlo.com/guides/rmm-agent-installation-troubleshooting) | Diagnosing enrollment, service, connectivity, permission, proxy, and first-check-in failures without repeatedly reinstalling |
| [How to test RMM software safely](https://nizlo.com/guides/how-to-test-rmm-software) | Running a staged pre-production pilot for agents, permissions, monitoring, patching, automation, remote access, and clean removal |

## Machine-readable index

[`resource-index.json`](resource-index.json) exposes the same catalogue as structured data for internal portals, documentation tools, and agents. The public [Data Package descriptor](https://izikipizi.github.io/nizlo-msp-operations-resources/datapackage.json) supplies schemas, byte counts, and SHA-256 hashes for all five CSV templates. The [Atom feed](https://izikipizi.github.io/nizlo-msp-operations-resources/feed.xml) makes the catalogue available to feed readers and aggregators, while [`llms.txt`](https://izikipizi.github.io/nizlo-msp-operations-resources/llms.txt) provides a compact answer-engine profile. Each entry points to the maintained canonical guide rather than an unversioned copy.

## Citation and preservation

Citation metadata is available in [`CITATION.cff`](CITATION.cff) and on the public [citation and preservation page](https://izikipizi.github.io/nizlo-msp-operations-resources/citation.html). Software Heritage preserves release `v1.17.0` and its repository history as snapshot [`swh:1:snp:68c31554c6afeafc9a65a713c6045412ad9362d7`](https://archive.softwareheritage.org/browse/snapshot/68c31554c6afeafc9a65a713c6045412ad9362d7/). The archive is a preservation service, not an endorsement of Nizlo or these resources.

## Reusable field templates

Browse the public [RMM operations and incident response template library](https://izikipizi.github.io/nizlo-msp-operations-resources/templates/) for direct downloads and usage guidance.

Use the dedicated [RMM deployment-readiness checklist template](https://izikipizi.github.io/nizlo-msp-operations-resources/rmm-deployment-readiness-template.html) for phase guidance, field documentation, and the public 33-control CSV. It helps assign owners, record evidence, define rollback triggers, and reconcile exceptions across governance, inventory, preparation, pilot, wave rollout, verification, and closeout.

Use the [RMM change-window and rollback-plan template](https://izikipizi.github.io/nizlo-msp-operations-resources/rmm-change-window-rollback-plan.html) when a deployment, migration, policy change, or automation rollout needs explicit timing, go/no-go authority, success criteria, communications, and a reversible execution path. The underlying [26-control CSV](https://izikipizi.github.io/nizlo-msp-operations-resources/templates/rmm-change-window-rollback-plan.csv) is public and ungated.

Use the [RMM incident response runbook template](https://izikipizi.github.io/nizlo-msp-operations-resources/rmm-incident-response-runbook-template.html) to coordinate readiness, detection, evidence preservation, containment, investigation, recovery, stakeholder communication, and corrective action after a suspected RMM security event. The underlying [30-control CSV](https://izikipizi.github.io/nizlo-msp-operations-resources/templates/rmm-incident-response-runbook.csv) is public and ungated, and the canonical [RMM incident response checklist](https://nizlo.com/guides/rmm-incident-response-checklist) explains the full eight-stage workflow.

Use the [RMM migration checklist workbook](https://izikipizi.github.io/nizlo-msp-operations-resources/rmm-migration-workbook-template.html) to reconcile source inventory, target mappings, pilot evidence, coexistence, cutover waves, rollback, source retirement, and final acceptance. The underlying [30-control CSV](https://izikipizi.github.io/nizlo-msp-operations-resources/templates/rmm-migration-workbook.csv) is public and ungated.

Use the [RMM evaluation scorecard](https://izikipizi.github.io/nizlo-msp-operations-resources/rmm-evaluation-scorecard-template.html) to compare observed pilot evidence across inventory, monitoring, patching, automation, remote support, permissions, audit evidence, recovery, removal, and technician usability. The underlying [10-area CSV](https://izikipizi.github.io/nizlo-msp-operations-resources/templates/rmm-evaluation-scorecard.csv) is public and ungated.

## More free tools

The [Nizlo RMM tools hub](https://nizlo.com/tools) also includes cost calculators, due-diligence scorecards, comparison worksheets, and deployment resources.

## Relationship disclosure

This repository is maintained by the Nizlo team. Nizlo is a Windows-first RMM and IT-management platform for MSPs and IT teams. Inclusion here is not an independent endorsement of Nizlo, and the checklists do not claim that any vendor passes their controls.

Product information: [nizlo.com](https://nizlo.com/)
