import pytest
from src.main import load_json
from pathlib import Path

MOCK_DATA_DIR = Path(__file__).resolve().parent / "mock_data"

def test_1_1_load_json_valid():
    mock_input = MOCK_DATA_DIR / "mockInput.json"
    result = load_json(mock_input)
    assert set(result.keys()) == {"holds", "start", "finish"}


def test_1_2_missing_field():
    mock_input = MOCK_DATA_DIR / "mockMissingFinish.json"
    with pytest.raises(ValueError, match="Missing keys: finish"):
        load_json(mock_input)


def test_1_3_extra_field():
    mock_input = MOCK_DATA_DIR / "mockExtraField.json"
    with pytest.raises(ValueError, match="Unexpected keys: extra"):
        load_json(mock_input)


def test_1_4_missing_and_extra_fields():
    mock_input = MOCK_DATA_DIR / "mockBadStructure.json"
    with pytest.raises(ValueError, match="Invalid JSON structure. Missing keys: finish; Unexpected keys: extra"):
        load_json(mock_input)
