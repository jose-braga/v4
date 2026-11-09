<template>
    <div class="privacy-notice text-body-2">
        <p class="text-medium-emphasis mb-4">Last updated: {{ lastUpdated }}</p>

        <h3>1. Who is responsible for your data</h3>
        <p>
            The data controller {{ controller }}. The data protection officer can be contacted at
            <a>{{ dpoEmail }}</a>.
        </p>

        <h3>2. What data we process</h3>
        <ul>
            <li>Identification: full name, display name, gender, date of birth, nationalities, photo.</li>
            <li>Personal contacts: home address, postal code, city, personal phone and email.</li>
            <li>Emergency contacts: name and phone number of the people you indicate.</li>
            <li>Professional data: lab, group and unit affiliations, offices and facilities, positions, dedication and dates,
                academic degrees and affiliations, professional situation (including fellowships and funding), workplace.</li>
            <li>Scientific profile: short CV, personal web pages, ORCID, Researcher ID, Ciência ID, publications and
                other scientific contributions.</li>
            <li>Account data: username, login activity and the technical logs of the platform.</li>
        </ul>

        <h3>3. Why we process it, and on what basis</h3>
        <ul>
            <li>Internal management of the research units (membership, affiliations, reporting): {{ internalBasis }}.</li>
            <li>Dissemination of the activities of the units on the public website: your consent (see section 4).</li>
            <li>Security and operation of the platform: {{ securityBasis }}.</li>
        </ul>

        <h3>4. Consent to publication</h3>
        <p>
            In accordance with the General Data Protection Regulation (EU) 2016/679, in force since 25 May, 2018,
            I have been informed that:
        </p>
        <ul>
            <li>
                All data provided through the platform https://v2.laqv-ucibio.info/ can be used to:
                (1) the internal management of the research team and (2) dissemination of the activities of the institution.
                For the second purpose, only the Full name, Colloquial name, Photo URL, Academic degrees &amp; academic jobs,
                Lab and group affiliations within LAQV or UCIBIO, Institutional contacts: Email, Phone and Internal Phone
                extension, Institutional personal webpage &amp; CV, ORCID, Researcher ID, Ciência ID, and Publications will be used.
            </li>
            <li>
                I have the right to request, at any time, the access to my personal data, as well as the rectification or
                erasure of data collected for dissemination purposes, by sending an email to
                <a :href="`mailto:${rightsEmail}`">{{ rightsEmail }}</a>.
            </li>
            <li>
                The Research Units have taken technical and organizational measures necessary to ensure the protection
                of my personal data;
            </li>
            <li>By saying YES, I consent to the use of my personal data for the above-mentioned purposes.</li>
        </ul>
        <p>
            You give this consent by switching on "Make my profile visible", and you can withdraw it at any time by
            switching it off. Withdrawing does not affect the lawfulness of the use made of your data before that.
        </p>

        <h3>5. Who can see your data</h3>
        <ul>
            <li>You, and the people you authorise in "Editors of your data".</li>
            <li>The managers of the research unit(s) you belong to, to manage membership and affiliations.</li>
            <li>The public, through the institutional website, only for the items listed in section 4 and only while your profile is visible.</li>
            <li>{{ otherRecipients }}</li>
        </ul>

        <h3>6. How long we keep it</h3>
        <p>{{ retention }}</p>

        <h3>7. Your rights</h3>
        <p>
            You may ask at any time for access to your data, its rectification or erasure, the restriction of its processing,
            or object to it, and, where applicable, receive it in a portable format. Write to
            <a :href="`mailto:${rightsEmail}`">{{ rightsEmail }}</a>. Most of your data can also be corrected directly
            in this platform. If you believe your rights have not been respected, you may lodge a complaint with the
            Portuguese supervisory authority, the Comissão Nacional de Proteção de Dados (CNPD),
            <a href="https://www.cnpd.pt" target="_blank" rel="noopener noreferrer">www.cnpd.pt</a>.
        </p>

        <h3>8. Emergency contacts</h3>
        <p>
            If you register an emergency contact, you are providing data about another person. Please let them know, and
            only provide what is needed to reach them in an emergency.
        </p>

        <h3>9. Cookies</h3>
        <p>
            This platform uses a single cookie to keep you signed in. It is strictly necessary for the service, so no
            consent is requested. No analytics or advertising cookies are used.
        </p>
    </div>
</template>

<script lang="ts" setup>
// TODO(DPO): every value below must be confirmed or replaced before release.
// Search the project for "TODO(DPO)" to find them.
const lastUpdated = '2026-11-06'
const controller = 'are the research units UCIBIO and LAQV'
const dpoEmail = ' dpo@unl.pt (NOVA FCT) or dpo@reit.up.pt (FFUP)'
const rightsEmail = 'josebraga@fct.unl.pt'                       // taken from the existing notice
const internalBasis = ''//'[legal basis, e.g. public interest task / legal obligation / contract]'
const securityBasis = ''//'[legal basis, e.g. legitimate interest]'
const otherRecipients = ''//'[other recipients, e.g. the operator of the institutional website, funding agencies; or remove this line]'
const retention = 'While you are a member and for 5 years afterwards'
</script>

<style scoped>
.privacy-notice h3 {
    font-size: 1rem;
    font-weight: 600;
    margin: 20px 0 6px;
}
.privacy-notice h3:first-of-type { margin-top: 0; }
.privacy-notice p { margin-bottom: 12px; }
.privacy-notice ul { padding-left: 24px; margin-bottom: 12px; }
.privacy-notice li { margin-bottom: 4px; }
</style>