import { assignTerrainAndTokens, buildBoardGeometry } from '../board';

describe('buildBoardGeometry', () => {
  it('produces 19 hexes, 54 vertices, 72 edges', () => {
    const geo = buildBoardGeometry();
    expect(geo.hexes.length).toBe(19);
    expect(geo.vertices.length).toBe(54);
    expect(geo.edges.length).toBe(72);
  });

  it('every hex has 6 vertexIds and 6 edgeIds', () => {
    const geo = buildBoardGeometry();
    for (const h of geo.hexes) {
      expect(h.vertexIds.length).toBe(6);
      expect(h.edgeIds.length).toBe(6);
    }
  });

  it('corner hex vertices are shared by 1-3 hexes, center hex vertices by up to 3', () => {
    const geo = buildBoardGeometry();
    const centerHex = geo.hexes.find((h) => h.coord.q === 0 && h.coord.r === 0)!;
    const sharedCounts = centerHex.vertexIds.map((vid) => geo.vertices[vid].hexIds.length);
    expect(sharedCounts.every((c) => c >= 1 && c <= 3)).toBe(true);
    expect(Math.max(...sharedCounts)).toBe(3);
  });
});

describe('assignTerrainAndTokens', () => {
  it('assigns exactly 1 wasteland and 18 tokens matching NUMBER_TOKENS', () => {
    const geo = assignTerrainAndTokens(buildBoardGeometry());
    const wastelandCount = geo.hexes.filter((h) => h.terrain === 'wasteland').length;
    expect(wastelandCount).toBe(1);

    const tokens = geo.hexes.filter((h) => h.token !== null).map((h) => h.token as number);
    expect(tokens.length).toBe(18);
    const sortedTokens = [...tokens].sort((a, b) => a - b);
    expect(sortedTokens).toEqual([2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]);

    const wasteland = geo.hexes.find((h) => h.terrain === 'wasteland')!;
    expect(wasteland.token).toBeNull();
  });
});
