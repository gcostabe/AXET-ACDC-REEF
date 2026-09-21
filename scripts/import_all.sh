#!/usr/bin/env bash
set -e

echo "=== Starting ACDC MongoDB Data Import ==="

# Import DUP files
echo ""
echo "--- Importing DUP Collections (Database: acdc_dup_br-int) ---"
for file in DUP/*.json; do
  [ -e "$file" ] || continue
  filename=$(basename "$file")
  collname="${filename#acdc_dup_br-int.}"
  collname="${collname%.json}"
  
  if [ "$(wc -c < "$file")" -le 4 ]; then
    echo "Skipping empty file $filename"
    continue
  fi

  echo -n "Importing $collname ... "
  docker exec acdc-mongodb mongoimport --db acdc_dup_br-int --collection "$collname" --file "/dumps/$file" --jsonArray --drop --quiet
  count=$(docker exec acdc-mongodb mongosh --quiet --eval "db.getSiblingDB('acdc_dup_br-int').getCollection('$collname').countDocuments()")
  echo "OK ($count docs)"
done

# Import RTE files
echo ""
echo "--- Importing RTE Collections (Database: acdc_rte_br-int) ---"
for file in RTE/*.json; do
  [ -e "$file" ] || continue
  filename=$(basename "$file")
  collname="${filename#acdc_rte_br-int.}"
  collname="${collname%.json}"
  
  if [ "$(wc -c < "$file")" -le 4 ]; then
    echo "Skipping empty file $filename"
    continue
  fi

  echo -n "Importing $collname ... "
  docker exec acdc-mongodb mongoimport --db acdc_rte_br-int --collection "$collname" --file "/dumps/$file" --jsonArray --drop --quiet
  count=$(docker exec acdc-mongodb mongosh --quiet --eval "db.getSiblingDB('acdc_rte_br-int').getCollection('$collname').countDocuments()")
  echo "OK ($count docs)"
done

echo ""
echo "=== All collections imported successfully! ==="
