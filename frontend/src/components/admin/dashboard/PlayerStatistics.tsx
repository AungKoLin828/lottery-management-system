export default function PlayerStatistics() {
  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h2 className="font-bold mb-4">Player Statistics</h2>

      <ul className="space-y-3">
        <li>
          Total Players:
          <b> 12500</b>
        </li>

        <li>
          Active Players:
          <b> 3500</b>
        </li>

        <li>
          New Today:
          <b> 120</b>
        </li>

        <li>
          Online:
          <b> 560</b>
        </li>
      </ul>
    </div>
  );
}
