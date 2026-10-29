"""Project canonical learning data into the intentionally limited public form."""
from copy import deepcopy

SOURCE_ONLY_CASE_FIELDS = ("originalQuestion", "originalQuestionSha256", "originalQuestionLocation",
                           "originalFileSha256", "hasOriginalAnswer")


def public_knowledge(knowledge):
    public = deepcopy(knowledge)
    for case in public.get("cases", []):
        for key in SOURCE_ONLY_CASE_FIELDS:
            case.pop(key, None)
    return public


def validate_public_knowledge(knowledge):
    for case in knowledge.get("cases", []):
        if any(key in case for key in SOURCE_ONLY_CASE_FIELDS):
            raise ValueError("Source-only fields present in public case " + str(case.get("id", "")))
