from typing import NamedTuple, Optional

class State(NamedTuple):
    """
    Represents the climber's state, defined by the hold ID for each limb.
    Using Optional[int] allows a limb to be temporarily off a hold.
    """
    RH: Optional[int]
    LH: Optional[int]
    RF: Optional[int]
    LF: Optional[int]

    def __repr__(self):
        return f"(RH={self.RH}, LH={self.LH}, RF={self.RF}, LF={self.LF})"