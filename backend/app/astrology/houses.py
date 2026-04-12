
def whole_sign_house_from_longitude(ascendant_deg: float, body_lon_deg: float) -> int:
    asc_sign = int((ascendant_deg % 360) // 30)
    body_sign = int((body_lon_deg % 360) // 30)
    return ((body_sign - asc_sign) % 12) + 1
