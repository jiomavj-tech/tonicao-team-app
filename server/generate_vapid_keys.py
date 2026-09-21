#!/usr/bin/env python3
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization

key=ec.generate_private_key(ec.SECP256R1())
private_pem=key.private_bytes(serialization.Encoding.PEM,serialization.PrivateFormat.PKCS8,serialization.NoEncryption()).decode()
public=key.public_key().public_numbers()
raw=b"\\x04"+public.x.to_bytes(32,"big")+public.y.to_bytes(32,"big")
public_b64=base64.urlsafe_b64encode(raw).decode().rstrip("=")

print("TONICAO_VAPID_PUBLIC_KEY="+public_b64)
print("TONICAO_VAPID_PRIVATE_KEY="+private_pem.replace("\n","\\n"))
print("TONICAO_VAPID_SUBJECT=mailto:seu-email@exemplo.com")
