from webauthn import generate_registration_options, generate_authentication_options
from webauthn.helpers.structs import AuthenticatorSelectionCriteria, UserVerificationRequirement, PublicKeyCredentialDescriptor, PublicKeyCredentialType
from webauthn.helpers.options_to_json import options_to_json

options = generate_registration_options(
    rp_id="localhost",
    rp_name="PaperInsight",
    user_id=b"user_12345",
    user_name="admin",
    user_display_name="Admin User",
    authenticator_selection=AuthenticatorSelectionCriteria(
        user_verification=UserVerificationRequirement.PREFERRED
    )
)
print("Reg Options:", options_to_json(options))

auth_options = generate_authentication_options(
    rp_id="localhost",
    allow_credentials=[PublicKeyCredentialDescriptor(type=PublicKeyCredentialType.PUBLIC_KEY, id=b"fakeid")],
    user_verification=UserVerificationRequirement.PREFERRED
)
print("Auth Options:", options_to_json(auth_options))
