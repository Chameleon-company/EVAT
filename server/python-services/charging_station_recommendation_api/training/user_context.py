from typing import Dict, List, Any


def get_session_time(session: Dict[str, Any]):
    """
    Get the best available timestamp for a recommendation session.
    """
    return (
        session.get("createdAt")
        or session.get("updatedAt")
        or (session.get("selection") or {}).get("selectedAt")
    )


def build_user_context(
    user_id: str,
    current_session: Dict[str, Any],
    all_sessions: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Build user behavioural context using only sessions that happened
    before the current recommendation session.

    This prevents future-session data leakage during training.
    """

    current_time = get_session_time(current_session)

    previous_user_sessions = []

    for session in all_sessions:

        # Only sessions belonging to the same user.
        if str(session.get("userId")) != str(user_id):
            continue

        # Do not count the current session.
        if str(session.get("_id")) == str(current_session.get("_id")):
            continue

        session_time = get_session_time(session)

        # Only use sessions that happened before the current session.
        if current_time is not None and session_time is not None:
            if session_time >= current_time:
                continue

        # Only completed recommendation sessions are useful.
        selection = session.get("selection") or {}

        if selection.get("stationId") is None:
            continue

        previous_user_sessions.append(session)

    return {
        "userPreviousSessions": len(previous_user_sessions),
    }