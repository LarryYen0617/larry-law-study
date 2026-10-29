"""Project canonical learning data into the intentionally limited public form."""
from copy import deepcopy


def public_knowledge(knowledge):
    public = deepcopy(knowledge)
    for case in public.get("cases", []):
        for key in ("originalQuestion", "originalQuestionSha256", "originalQuestionLocation",
                    "originalFileSha256", "hasOriginalAnswer"):
            case.pop(key, None)
    return public
