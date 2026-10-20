from langchain_core.prompts import PromptTemplate

EVALUATE_PAPER_PROMPT = PromptTemplate.from_template("""
You are a highly intelligent research assistant. 
A user is working on a project with the following topic and context:
Topic: {topic}
Context: {context}

They have uploaded a paper. Read the following text from the paper and determine if it is relevant and helpful for their project.

Paper Text:
{text}

Output a strictly valid JSON object with the following keys:
- "relevance": A string, either "High", "Medium", or "Low". **IMPORTANT**: Be extremely lenient! Mark papers as "High" or "Medium" even if they are only partially related. ONLY mark as "Low" if it is completely off-topic and useless.
- "reason": A brief 1-2 sentence explanation of why it helps or doesn't help.

Output ONLY JSON, no other formatting or markdown.
""")

QUERY_PROJECT_PROMPT = PromptTemplate.from_template("""
You are an expert research assistant helping a user with their project on '{topic}'.
Use the provided project context, and any excerpts from uploaded research papers (if available), to answer their question.
If they specifically ask about their uploaded papers and none are available, inform them to upload some. Otherwise, you MUST help them answer their question using your general knowledge.

CRITICAL INSTRUCTION: Keep your answer highly concise, direct, and brief to ensure the fastest possible response time. Do not write unnecessarily long introductions or conclusions.

Context Information:
{context}

Question: {question}

You MUST output your response as a strictly valid JSON object with the following keys:
- "answer": Your concise answer, formatted in Markdown.
- "confidence": A string indicating your certainty in this answer ("High", "Medium", or "Low").

Output ONLY JSON, no other text or markdown block formatting.
""")

GENERATE_SEARCH_QUERIES_PROMPT = PromptTemplate.from_template("""
You are a university librarian helping a researcher.
Their project is about:
Topic: {topic}
Context: {context}

Provide exactly 5 highly optimized Boolean search strings they can use in databases like Google Scholar, IEEE Xplore, or PubMed to find more relevant papers.

Output a strictly valid JSON array of objects, where each object has the following keys:
- "base": A string describing the basis of the search (e.g. "Methodology", "Application", "Core Concept")
- "query": The actual boolean search string
- "reason": A brief explanation of why this query is useful.

Output ONLY JSON, no markdown formatting.
""")

EXTRACT_CORE_CONCEPT_PROMPT = PromptTemplate.from_template("""
You are an expert academic researcher. Extract the single most important 2-4 word core domain concept from this topic (e.g., "Traffic Sign Recognition", "Breast Cancer Detection").
DO NOT include methods like "Deep Learning", "CNN", or "Hybrid". Just the core problem domain.
Topic: {topic}
Context: {context}

Return ONLY the exact phrase, nothing else. No quotes.
""")

PAPER_SUMMARY_REASON_PROMPT = PromptTemplate.from_template("""
You are an expert academic researcher. Based on the following project:
Topic: {topic}
Context: {context}

I have retrieved the following real papers from Semantic Scholar:
{papers_context}

For each paper, write a brief 1-2 sentence summary of why it supports the project.
Output a strictly valid JSON array of strings, where the index matches the paper index.
Example: ["Reason for paper 1", "Reason for paper 2"]
Output ONLY the JSON array, no markdown.
""")

MULTI_QUERY_PROMPT = PromptTemplate.from_template("""
You are an AI research assistant. Your task is to generate 3 alternative versions of a user's question to improve document retrieval in a vector database.
By generating multiple perspectives on the user's question, you help overcome the limitations of exact-match distance searches.
Provide these alternative questions separated by newlines.
Do not number them or add any extra text. Just output the 3 alternative queries.

User Question: {question}

Alternative Queries:
""")

EXTRACT_METADATA_PROMPT = PromptTemplate.from_template("""
You are an expert academic librarian. Your task is to extract structured metadata from the following snippet of a research paper (usually the first few pages).

Paper Snippet:
{text}

Extract the following information:
- "title": The full title of the paper.
- "authors": A list of author names.
- "year": The publication year (as a string). If not found, use "Unknown".
- "abstract": A brief summary of the paper's abstract (1-2 sentences).
- "keywords": A list of up to 5 relevant keywords.

Output a strictly valid JSON object with the exact keys: "title", "authors", "year", "abstract", "keywords".
Output ONLY JSON, no markdown formatting.
""")

PAPER_TARGET_EXTRACTION_PROMPT = PromptTemplate.from_template("""
You are a highly analytical AI router. Your task is to determine if the user's question is asking to query or compare SPECIFIC papers from their project.

Available Papers in this Project:
{available_papers}

User Question: {question}

If the user is asking about specific papers (e.g., "Compare Paper A and Paper B", "What does Smith say?", "Summarize the Attention paper"), extract the exact filenames of those papers from the 'Available Papers' list.
Output a strictly valid JSON array of strings representing the exact filenames.
If the user's question is general and does not target specific papers, output an empty JSON array: []

Output ONLY the JSON array, no markdown or explanation.
""")

MULTI_PAPER_COMPARE_PROMPT = PromptTemplate.from_template("""
You are an expert academic research assistant helping a user compare multiple papers for their project on '{topic}'.
Use the provided chunks from the targeted research papers to concisely answer the user's question.

CRITICAL INSTRUCTION: Keep your answer highly concise, direct, and brief to ensure the fastest possible response time. Do not write unnecessarily long introductions or conclusions.

Context Information (Segmented by Paper):
{context}

Question: {question}

You MUST output your response as a strictly valid JSON object with the following keys:
- "answer": Your concise answer, formatted in Markdown.
- "confidence": A string indicating your certainty in this answer ("High", "Medium", or "Low").

Output ONLY JSON, no other text or markdown block formatting.
""")

GAP_DETECTION_PROMPT = PromptTemplate.from_template("""
You are a Principal Investigator reviewing literature for a new project on '{topic}'.
Your task is to analyze the provided excerpts from recent papers and identify unaddressed problems, acknowledged limitations, drawbacks, and proposed future work.

Using this information, generate novel research gaps and directions.

Context Information:
{context}

Output your analysis as a strictly valid JSON array of objects. Each object must have the following keys exactly:
"identified_gap": A brief description of the limitation or unsolved problem.
"source_papers": A list of strings, representing the filenames of the papers that mention this gap.
"proposed_research_direction": A novel idea for future work to address this gap.
"expected_impact": A string (High, Medium, or Low) estimating the impact of solving this gap.

Output ONLY the JSON array, with no markdown formatting or extra text.
""")

LIT_REVIEW_MAP_PROMPT = PromptTemplate.from_template("""
You are an expert academic researcher. You are analyzing a batch of {num_papers} papers for a project on '{topic}'.
Below are chunks from these papers.

For each paper, extract the following information:
- TITLE
- YEAR
- AUTHORS
- SUMMARY
- METHODS AND ALGORITHMS
- LIMITATIONS
- RESEARCH GAPS

Format your output as a series of structured records, one for each paper, clearly labeled with the above headings. If any information is missing from the context, mark it as "Not specified".

Papers in this batch:
{context}

Structured Records:
""")

LIT_REVIEW_REDUCE_PROMPT = PromptTemplate.from_template("""
You are an expert academic writer. You are finalizing a literature review for a project on '{topic}'.
Below are several structured records generated from different batches of papers.

Your task is to compile these records into a single Markdown table.
The table MUST have exactly the following columns in this exact order:
| S.NO | TITLE | YEAR | AUTHORS | SUMMARY | METHODS AND ALGORITHMS | LIMITATIONS | RESEARCH GAPS |

- S.NO should be a sequential number starting from 1.
- Synthesize the extracted information into concise sentences for each cell.
- Do NOT add any introductory or concluding text outside of the table. Output ONLY the Markdown table.

Extracted Records:
{context}

Markdown Table:
""")

GRAPH_EXTRACTION_PROMPT = PromptTemplate.from_template("""
You are an AI tasked with building a Knowledge Graph from research papers.
Extract key entities (Methods, Datasets, Problems, Findings, Authors) and the relationships between them from the provided text.

The source paper is: '{filename}'

Output your findings strictly as a JSON object with two keys: "nodes" and "edges".
- Nodes should have "id" (the entity name) and "label" (the type of entity: Paper, Method, Dataset, Problem, Finding, Author).
- Edges should have "source" (node id), "target" (node id), and "relation" (a short verb phrase describing how they connect, e.g. "proposes", "evaluates on", "solves").
Always include the source paper itself as a node (label: "Paper") and link it to the entities it introduces or uses.

Context:
{context}

Output ONLY valid JSON.
""")

AGENT_SYNTHESIZE_PROMPT = PromptTemplate.from_template("""
You are the Synthesizer Agent. Your task is to draft an initial response to the user's question based on the provided research context.
If there is feedback from the Critic Agent, you MUST incorporate it and improve your draft.

Global User Preferences (You MUST follow these stylistic rules):
{user_preferences}

User's Question: {question}

Context from Vector DB:
{context}

Feedback from Critic (if any):
{feedback}

Draft Response:
""")

AGENT_CRITIC_PROMPT = PromptTemplate.from_template("""
You are the Critic Agent. Your task is to review the draft response provided by the Synthesizer Agent.
Evaluate the draft based on the following criteria:
1. Does it fully answer the user's question?
2. Does it use the provided context accurately?
3. Does it explicitly cite the source papers?

If the draft meets all criteria, output "ACCEPT".
If the draft fails any criteria, output "REJECT" followed by a newline and then specific feedback on what needs to be fixed.

User's Question: {question}

Draft Response:
{draft}

Review Decision (ACCEPT or REJECT with feedback):
""")

PREFERENCE_EXTRACTION_PROMPT = PromptTemplate.from_template("""
You are a Memory Agent. Your task is to analyze the user's message and extract any explicit instructions or preferences about how you should format, style, or generate responses in the future.
Ignore questions about papers. Only extract meta-instructions (e.g., "Keep it short", "Use bullet points", "Don't use jargon").

If there are no preferences, output exactly "NONE".
If there are preferences, output them clearly as a concise instruction string.

User's Message: {message}

Extracted Preference:
""")

CLAIM_EXTRACTION_PROMPT = PromptTemplate.from_template("""
You are a Verification Agent. Your task is to break down the provided draft text into a list of atomic, verifiable claims.
An atomic claim is a single statement of fact that can be checked against a source document.

Output the claims strictly as a JSON list of strings.

Draft Text:
{draft}

Output ONLY valid JSON list:
""")

HALLUCINATION_CHECK_PROMPT = PromptTemplate.from_template("""
You are a Fact-Checking Agent. Verify if the given claim is supported by the provided context.
Output exactly one of the following labels, followed by a newline and a brief 1-sentence explanation:
SUPPORTED (if the context clearly backs up the claim)
CONTRADICTED (if the context explicitly contradicts the claim)
UNSUPPORTED (if the context does not contain enough information to verify the claim)

Claim: {claim}

Context:
{context}

Verification Result:
""")

RECOMMENDATION_QUERY_PROMPT = PromptTemplate.from_template("""
You are a Research Assistant. Analyze the provided list of paper titles and summaries in the user's project.
Your task is to generate a single, highly optimized academic search query to find related external papers on ArXiv.
The query should be 2 to 5 keywords maximum. Do not use quotes or complex boolean operators.

Project Content:
{context}

Output ONLY the search query string.
""")

DEEP_RESEARCH_PLAN_PROMPT = PromptTemplate.from_template("""
You are a Lead Researcher. The user wants a comprehensive, deep-dive report on the following topic based on their uploaded papers.
Break the topic down into 3 to 5 specific sub-queries that should be investigated independently.

Topic: {topic}

Output a STRICTLY VALID JSON array of strings representing the sub-queries.
DO NOT output any markdown formatting, do not use ```json, and do not add any conversational text.
ONLY return the raw JSON array starting with '[' and ending with ']'.
""")

DEEP_RESEARCH_SYNTHESIZE_PROMPT = PromptTemplate.from_template("""
You are a Lead Editor. You have received several independent research reports from your agents on different sub-topics.
Your task is to synthesize these reports into one final, highly comprehensive, and beautifully formatted markdown document.
Make sure the document flows logically from introduction to conclusion.
Include the verification warnings if any claims were flagged as hallucinated, so the user knows what to double-check.

Topic: {topic}

Sub-Reports:
{reports}

Final Comprehensive Report:
""")

FRAME_EXTRACTION_PROMPT = PromptTemplate.from_template("""
You are a deterministic rule-based extractor.
Your task is to extract exact knowledge frames from the following research paper context.

Filename: {filename}

Context:
{context}

You MUST output ONLY a strictly valid JSON object with the following structure:
{{
  "Methodology": "A short summary of the methodology used.",
  "Dataset": "The specific datasets or data sources mentioned.",
  "Metrics": "The evaluation metrics used (e.g., accuracy, precision, F1-score)."
}}

If a field is not explicitly mentioned in the context, write "Not specified".
""")

DEBATE_PROMPT = PromptTemplate.from_template("""
You are a highly analytical AI debate moderator.
Your task is to analyze the provided research context regarding the topic: '{topic}'.
You must synthesize the context into a rigorous Pro/Con debate table, summarizing the arguments FOR and AGAINST the main claims or methodologies found in the papers.

Context:
{context}

You MUST output ONLY a strictly valid JSON object with the following structure:
{{
  "debate": [
    {{
      "claim": "A specific claim, methodology, or finding",
      "pros": ["Advantage 1", "Advantage 2"],
      "cons": ["Limitation 1", "Limitation 2"]
    }}
  ]
}}
""")
