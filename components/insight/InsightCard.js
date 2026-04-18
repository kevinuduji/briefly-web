/**
 * Pull-quote style insight — considered, personal typography (italic, muted, quote bar).
 */
export function InsightCard({ insightText }) {
  return (
    <>
      <p
        className="text-[11px] font-semibold uppercase tracking-wide text-[#6d7175]"
        style={{ letterSpacing: '0.04em' }}
      >
        THE ONE THING RIGHT NOW
      </p>
      <div className="mt-2">
        <div
          className="mx-auto max-w-[560px]"
          style={{
            borderLeft: '2px solid #e1e3e5',
            paddingLeft: '16px',
          }}
        >
          <p
            style={{
              fontStyle: 'italic',
              fontWeight: 400,
              fontSize: '17px',
              color: '#444748',
              lineHeight: 1.75,
              margin: '0 auto 32px',
              maxWidth: '560px',
            }}
          >
            {insightText}
          </p>
        </div>
      </div>
    </>
  );
}
