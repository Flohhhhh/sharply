import { ConstructionNotice } from "../gear/_components/construction-notice";

export default function ConstructionTest() {
  return (
    <div>
      <ConstructionNotice
        gearName="Canon EOS R5"
        slug="canon-eos-r5"
        missing={["ISO", "Shutter Speed", "Aperture"]}
        editHref="/gear/canon-eos-r5/edit"
      />
    </div>
  );
}
