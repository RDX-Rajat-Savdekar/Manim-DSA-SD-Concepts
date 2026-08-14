Read @data/crawl-reports/remotion-projects-report.md.

Distill this into a context capsule at data/project-context/remotion-projects.md.
    
Goal: a future agent can read ONLY this file and work on fact-layer JSON, interview prep,
or resume bullets WITHOUT re-opening the codebase. Target ~150–300 lines max.

Include ONLY high-signal content:
1. Meta — project id, name, crawl date, author email filter, paths skipped, link to full report
2. One-liner identity + problem (2–3 sentences max)
3. Directory map — table: path → what lives there → why it matters (10–20 rows max, no junk dirs)
4. Entry points — where execution starts (main files, bootstraps, route roots)
5. Architecture decisions — decision / why / rejected alternative / evidence pointer (file:line)
6. Author scope — what I built vs what libraries did (honesty boundary)
7. Tech stack — exact strings + manifest that proves each
8. Hard parts — 3–7 bullets with evidence pointers
9. Metrics table — compact; keep MEASURED/ESTIMATED/NEEDS-INPUT labels and confidence
10. Top candidate bullets — 3–6 only, with archetype tags (not polished resume copy)
11. Interview hooks — Q + one-line answer seed
12. Never-claim / low-confidence items
13. NEEDS HUMAN INPUT — unanswered questions only
14. Re-crawl triggers — when this capsule is stale (e.g. "after replay system rewrite")


Do NOT: paste code blocks longer than 5 lines, duplicate the full evidence index, or invent
facts not in the report.

When done, tell me the line count and what a future agent should @-mention for this project.